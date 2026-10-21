# Port Golden Corpus Schema

**One-line description:** Defines the language-neutral JSON Lines format for the cross-language golden corpus, with typed encodings for values JSON cannot carry exactly (64-bit and big integers, doubles including -0.0 and NaN, bytes, invalid Unicode), error categories, and per-field comparison rules (exact, unordered, masked), so capture and replay harnesses in different languages agree on what equal means.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`.
- `nondeterminism_sources` (object[], required): Output of `port-nondeterminism-inventory`; supplies masks and unordered fields.
- `error_mapping` (object, required): Output of `port-error-model-mapping`; supplies error categories and message rules.

---

## Outputs

- `corpus_schema` (object): The record format, the typed value encodings, the comparison rules per behavior, the directory layout, and a `SCHEMA.md` text to commit beside the corpus.

---

## Phase 1: Fix the Record Format

### Entry Criteria
- All three inputs exist.

### Actions
1. Use one JSON object per line (JSON Lines, UTF-8, `\n` line endings). Each record has exactly these keys:
```
{"id": "B-001/0007", "behavior": "B-001", "call": "slugkit.slugify",
 "input": {"args": [...], "kwargs": {...}, "stdin": null, "env": {}, "files": {}},
 "expect": {"kind": "ok", "value": ...}
          | {"kind": "error", "category": "invalid_argument", "message": "..."}
          | {"kind": "process", "exit_code": 0, "stdout": "...", "stderr": "..."}
          | {"kind": "ub", "note": "UBSan: signed integer overflow at hash.c:41"},
 "tags": ["boundary:int64", "unicode:astral"]}
```
2. Use these typed encodings for every value inside `args`, `kwargs`, and `value`. Plain JSON is allowed only for `true`, `false`, `null`, valid-Unicode strings, arrays and objects.

| Value | Encoding | Why |
|---|---|---|
| Any integer | `{"$int": "-9223372036854775808"}` (decimal string) | JavaScript `JSON.parse` loses precision above 2^53 - 1; one rule for all integers prevents mistakes |
| Any double | `{"$f64": "8000000000000000"}`: the 64-bit IEEE 754 bit pattern as 16 lowercase hex digits | Exact, keeps -0.0 (`8000000000000000`) and infinities; decimal text does not round-trip identically across languages |
| NaN | `{"$f64": "nan"}` | NaN payload bits differ between runtimes; all NaNs compare equal |
| Bytes | `{"$bytes": "<standard base64>"}` | JSON strings cannot hold arbitrary bytes |
| String that is not valid Unicode (lone surrogate, invalid UTF-8) | `{"$badstr": "<base64 of the raw code units or bytes>", "enc": "utf-16-surrogatepass" or "raw-bytes"}` | Go's JSON decoder replaces lone surrogates with U+FFFD and serde_json rejects them |
| Map with non-string keys or where key order matters | `{"$map": [[key, value], ...]}` | JSON object keys are strings and JS reorders integer-like keys |
| Set | `{"$set": [...]}`, elements sorted by their canonical JSON text | sets have no order |
| Date-time | `{"$instant": "2024-03-10T07:30:00.000000Z"}` (UTC, microseconds) | timezone and precision differ by language |
| Exact decimal | `{"$decimal": "12.340"}` (keep trailing zeros when the source keeps scale) | `Decimal("12.340")` and `BigDecimal` carry scale |

3. Encoding recipes for the bit pattern, per language (put them in `SCHEMA.md`):
   - Python: `struct.pack(">d", x).hex()`
   - JavaScript: `const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, x); dv.getBigUint64(0).toString(16).padStart(16, "0")`
   - Go: `fmt.Sprintf("%016x", math.Float64bits(x))`
   - Java / Kotlin: `String.format("%016x", java.lang.Double.doubleToRawLongBits(x))`
   - C: `uint64_t u; memcpy(&u, &x, 8); printf("%016" PRIx64, u);`
   - Rust: `format!("{:016x}", x.to_bits())`

### Output
Record format and encoding table.

### Quality Gate
- Each encoding recipe, run on `-0.0` in its language, prints `8000000000000000`, and on `0.1` prints `3fb999999999999a`. Run at least the source and target recipes and attach output.

---

## Phase 2: Set Comparison Rules

### Entry Criteria
- Record format fixed.

### Actions
1. For each in-scope behavior, write a comparison rule object with JSON paths (`$.value.items`, `$.stdout`):

| Rule | Meaning | Source of the rule |
|---|---|---|
| `exact` | encoded values must be identical | default for every path |
| `unordered` | compare as multisets: sort both sides by canonical JSON text, then compare | `nondeterminism_sources` with strategy `sort`, and `ordering` from concurrency mapping |
| `mask:<regex>` | replace regex matches with `<MASK>` on both sides before comparing | `nondeterminism_sources` with strategy `mask` |
| `category_only` | for errors, compare `category` and ignore `message` | `error_mapping` message rule `none` |
| `message_prefix` | compare `category` and the message up to the first variable part | `error_mapping` message rule `prefix` |
| `ulps:<n>` | doubles may differ by at most n units in the last place | only with a user-supplied n; never chosen here |

2. Text output (`stdout`, `stderr`) is compared as bytes after decoding as UTF-8; line endings are part of the output. Do not strip trailing whitespace unless the user says the consumer ignores it.
3. Canonical JSON text for sorting and hashing: keys sorted by code point, no whitespace, typed encodings as above.

### Output
Comparison rules per behavior.

### Quality Gate
- Every in-scope behavior has a rule object, even if it is only `exact`.
- Every `unordered` and `mask` rule points to a row id in `nondeterminism_sources`.
- No `ulps` rule exists without a user-supplied number.

---

## Phase 3: Fix the Layout

### Entry Criteria
- Rules complete.

### Actions
1. Canonical layout in the source repo (copied to the target later):
```
golden/
  SCHEMA.md            the encodings and rules from this flow
  rules.json           comparison rules per behavior
  categories.json      error class to category map from error_mapping
  B-001.jsonl          one file per behavior
  B-002.jsonl
  MANIFEST.json        written by port-golden-corpus-freeze
  SHA256SUMS           written by port-golden-corpus-freeze
```
2. Target copy locations, used by the replay flows:

| Target | Path | Reason |
|---|---|---|
| TypeScript | `test/golden/` | outside `src`, so `tsc` does not emit it |
| Go | `testdata/golden/` inside the package that tests it | the go tool ignores directories named `testdata` |
| Kotlin | `src/test/resources/golden/` | on the test classpath |
| Rust | `tests/golden/` | read by integration tests with `env!("CARGO_MANIFEST_DIR")` |

3. Write `SCHEMA.md` and `rules.json`; validate `rules.json` with `jq . golden/rules.json`.

### Output
`corpus_schema`.

### Quality Gate
- `jq . golden/rules.json` and `jq . golden/categories.json` exit 0.
- `SCHEMA.md` contains the record example, the encoding table, the six recipes, and the rule table.

---

## Worked Example

Illustrative. Behavior B-003 `stats.mean(values: list[float]) -> float`, behavior B-005 CLI `tagger` that prints tags from a set.

Records:
```
{"id":"B-003/0001","behavior":"B-003","call":"stats.mean","input":{"args":[[{"$f64":"3ff0000000000000"},{"$f64":"4000000000000000"}]],"kwargs":{},"stdin":null,"env":{},"files":{}},"expect":{"kind":"ok","value":{"$f64":"3ff8000000000000"}},"tags":[]}
{"id":"B-003/0002","behavior":"B-003","call":"stats.mean","input":{"args":[[]],"kwargs":{},"stdin":null,"env":{},"files":{}},"expect":{"kind":"error","category":"invalid_argument","message":"mean requires at least one data point"},"tags":["empty"]}
```
rules.json excerpt:
```
{"B-003": {"$.expect": "exact", "$.expect.message": "category_only"},
 "B-005": {"$.expect.stdout": "unordered_lines"}}
```
Recipe check:
```
$ python -c 'import struct;print(struct.pack(">d",-0.0).hex(), struct.pack(">d",0.1).hex())'
8000000000000000 3fb999999999999a
```

---

## Exit Criteria

DONE when the record format, typed encodings, comparison rules for every behavior, and layout are written to `golden/SCHEMA.md` and `golden/rules.json`, and both validate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A value type is not covered by the table (complex numbers, custom objects) | **Adjust**: add a typed encoding `{"$<type>": ...}` to `SCHEMA.md` with recipes for both languages before capture starts. |
| Phase 1 | Recipe output differs from the expected hex | **Stop**: fix the recipe; a wrong encoder corrupts every float in the corpus. |
| Phase 2 | A behavior needs a rule not in the table (for example "line order ignored") | **Adjust**: define it with a name and exact semantics in `SCHEMA.md`, as `unordered_lines` in the example. |
| Phase 2 | Someone proposes `ulps` to make tests pass | **Stop**: tolerance is a user decision recorded with its reason, never a fix for a failing case. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
