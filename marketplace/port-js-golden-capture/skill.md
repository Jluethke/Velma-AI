# Port JavaScript Golden Capture

**One-line description:** Runs the original JavaScript code in Node over every planned case input with a pinned environment (fixed `TZ`, fake timers, seeded randomness, recorded ICU version) and writes observed results and thrown errors as golden records in the typed JSON Lines schema, distinguishing `-0`, `NaN`, `undefined` and `null` that plain `JSON.stringify` would erase.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the JavaScript repository at the reference commit.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.
- `case_inputs` (object[], required): Output of `port-edge-case-input-set`.
- `nondeterminism_sources` (object[], required): Output of `port-nondeterminism-inventory`.

---

## Outputs

- `js_corpus` (object): Path to the written `golden/` directory, record count per behavior, the capture command, and the environment block (Node version, ICU version, `TZ`, frozen instant).

---

## Phase 1: Build the Capture Harness

### Entry Criteria
- Source at `reference_commit`, `git status --porcelain` empty, `npm ci` completed.

### Actions
1. Create `tools/golden-capture.mjs` (ES module; if the source is CommonJS, load it with `createRequire(import.meta.url)`). It has four functions:
   - `decode(v)`: `{"$int": s}` to a `number` when `Number.isSafeInteger(Number(s))` and the parameter is typed as number in the source, otherwise `BigInt(s)`; `{"$f64": h}` to a number via `DataView.setBigUint64(0, BigInt("0x" + h))` then `getFloat64(0)`; `"nan"` to `NaN`; `{"$bytes": b}` to `Buffer.from(b, "base64")`.
   - `encode(v)`: `typeof v === "number"`: if `Number.isInteger(v) && !Object.is(v, -0) && Number.isSafeInteger(v)` decide by the behavior's declared return type (integer or float, from `behavior_inventory`), because JS has no separate integer type; floats use the bit pattern, so `-0` stays `8000000000000000`. `bigint` to `$int`. `undefined` to `{"$undefined": true}` (add this encoding to `SCHEMA.md`; it matters when porting to TypeScript since `null` and `undefined` behave differently). `Map` to `$map`, `Set` to `$set`, `Date` to `$instant` via `toISOString()` (an invalid date throws `RangeError`: encode as `{"$instant": "invalid"}`), `Buffer` and `Uint8Array` to `$bytes`. Strings with lone surrogates (`/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/`) to `$badstr` with the UTF-16LE code units base64-encoded.
   - `call(record)`: dynamic `import()` the module, pick the export, call it, and `await` the result if it is a thenable. On a thrown value, read `e.name` (or `e.constructor.name`) and map it through `golden/categories.json`. A thrown non-Error (a string) maps to category `thrown_non_error` with the value as the message.
   - `runProcess(record)`: `spawnSync(process.execPath, [entry, ...args], { input, env: pinnedEnv, encoding: "buffer" })`; record `status`, `stdout`, `stderr`.
2. Apply `nondeterminism_sources`:
   - Clock: `import FakeTimers from "@sinonjs/fake-timers"; const clock = FakeTimers.install({ now: Date.parse("2024-01-02T03:04:05Z") });` before importing the source module, and `clock.uninstall()` at exit. Timers do not fire unless you call `clock.runAllAsync()` (or `clock.tickAsync(ms)`); call it for behaviors that use `setTimeout`.
   - `Math.random`: replace `Math.random` with a seeded generator before importing the source, and record that the target cannot reproduce V8's sequence (fields that print random values must be masked).
   - `crypto.randomUUID`: mask, per the inventory row.
3. Do NOT edit files under the source tree.

### Output
`tools/golden-capture.mjs`.

### Quality Gate
- `git -C <source_repo> diff --stat -- src` prints nothing.
- `node tools/golden-capture.mjs --selftest` round-trips one value per typed encoding, including `-0`, `NaN`, `undefined`, and a lone surrogate, and exits 0.

---

## Phase 2: Capture

### Entry Criteria
- Self-test passed.

### Actions
1. Run with the pinned environment:
```
TZ=UTC LC_ALL=C.UTF-8 node tools/golden-capture.mjs --cases cases.jsonl --out golden/
```
   Node reads `TZ` at startup; setting `process.env.TZ` later works on current Node versions but is easy to get wrong, so set it on the command line.
2. Read the harness summary (cases read, records written, errors by category). Every case produces exactly one record.
3. Capture again into `golden2/` and run `diff -r golden golden2`.

### Output
`golden/*.jsonl`.

### Quality Gate
- Records written equals cases read, and `wc -l golden/*.jsonl` agrees.
- `diff -r golden golden2` prints nothing.
- `jq -c . golden/*.jsonl > /dev/null` exits 0.

---

## Phase 3: Record the Environment

### Entry Criteria
- Two identical captures.

### Actions
1. Write `golden/ENV.json` from `node -p "JSON.stringify({node: process.version, icu: process.versions.icu, tz: process.env.TZ})"`, plus the `package-lock.json` hash (`sha256sum package-lock.json`), the frozen instant, and the reference commit. ICU matters for any `Intl`, `toLocaleString`, or `localeCompare` output.
2. Set `js_corpus` to the path, per-behavior counts, and the capture command.

### Output
`js_corpus`.

### Quality Gate
- `jq . golden/ENV.json` exits 0 and contains `node`, `icu`, and the reference commit.

---

## Worked Example

Illustrative. Source `price-utils` (JavaScript), port to TypeScript, 140 cases.

Phase 1 self-test:
```
$ node tools/golden-capture.mjs --selftest
selftest: -0 -> {"$f64":"8000000000000000"} OK; undefined -> {"$undefined":true} OK; "\ud800" -> $badstr OK
```
Phase 2:
```
$ TZ=UTC node tools/golden-capture.mjs --cases cases.jsonl --out golden/
cases=140 records=140 ok=121 error=19 (invalid_argument=17, thrown_non_error=2)
$ diff -r golden golden2; echo $?
0
```
The two `thrown_non_error` records come from `throw "bad currency"` in `currency.js:22`. The TypeScript port must keep throwing a string for parity, or the user approves a change to an Error subclass as an intended divergence.

---

## Exit Criteria

DONE when every case input has one golden record, `-0`, `NaN`, `undefined` and lone surrogates survive encoding, two captures are identical, and the Node and ICU versions are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Source is ESM-only and the harness uses `require` | **Adjust**: use dynamic `import()`; check `"type"` in `package.json`. |
| Phase 1 | Thrown error name missing from `categories.json` | **Stop**: return to `port-error-model-mapping`. |
| Phase 2 | Captures differ between runs | **Return**: to `port-nondeterminism-inventory` with the record id. |
| Phase 2 | Unhandled promise rejection kills the process | **Adjust**: `await` every call inside `try/catch` and also register `process.on("unhandledRejection", ...)` to record it against the current case. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
