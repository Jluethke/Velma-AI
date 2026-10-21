# Property Invariant Discovery

**One-line description:** Reads one target function or API and writes a catalog of checkable properties, each tagged with a named pattern (round-trip, idempotence, invariant preservation, oracle, metamorphic, algebraic law, model, no-crash), an input domain and its preconditions, so the next flows can turn every entry into a generator plus an assertion without guessing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_code` (string, required): Path plus symbol of the function, class or module to test, for example `src/codec/varint.py::encode`.
- `stack` (string, required): One of `python`, `node`, `rust`, `go`, `haskell`, `jvm`, `cpp`. Selects the downstream library.
- `technique` (string, required): `property`, `fuzz` or `both`. Controls which downstream steps run.
- `has_stateful_api` (boolean, required): True when the target keeps state between calls (a cache, queue, bank account, connection pool, B-tree). Enables model properties.
- `spec_notes` (string, optional): Docs, RFC sections, docstrings or ticket text that state required behavior.

---

## Outputs

- `property_catalog` (object[]): One row per property: `id`, `pattern`, `statement` (one sentence a test can assert), `functions` involved, `input_domain` (types, ranges, size limits, encodings), `preconditions`, `expected_errors` (documented exception or error types that are allowed), `source` (docstring line, spec section or code line that justifies it), and `stateful` flag.

---

## Phase 1: Inventory the Target Surface

### Entry Criteria
- `target_code` resolves to a file and symbol that exist. Check with `git ls-files | grep <file>` and a text search for the symbol name.

### Actions
1. Open the file and list every public function or method of the target with its full signature (parameter types, return type, raised or returned errors).
2. For each function, write down the documented contract from the docstring, type hints, comments and `spec_notes`. Copy the exact sentence; do not paraphrase it into something stronger.
3. Find function pairs and groups by name and type signature using this table:

| Signature shape | Look for its partner | Example |
|---|---|---|
| `A -> bytes` or `A -> str` | `bytes -> A` or `str -> A` | `encode` / `decode`, `dumps` / `loads`, `serialize` / `parse` |
| `A -> A` | the same function applied twice | `normalize`, `canonicalize`, `sort`, `dedupe`, `format` |
| `(A, A) -> A` | identity element, associativity, commutativity | `merge`, `union`, `max`, `concat` |
| `(collection, item) -> collection` | a `contains` or `len` query | `insert`, `push`, `add` |
| Any pure function with a slow or older version | that version | `fast_sqrt` vs `math.sqrt`, v2 parser vs v1 parser |
| Methods on one mutable object | a plain in-memory model (dict, list, counter) | `Cache.put/get/evict`, `Queue.push/pop` |

4. Record whether each function is pure (same input gives same output, no I/O, no clock, no global random state). Read the body: any call to time, random, environment, network, filesystem or a module-level mutable makes it impure.

### Output
A surface table: function, signature, contract quote, partner functions, purity flag.

### Quality Gate
- Every public function of the target appears in the table (count matches `grep -c "def \|fn \|func \|function "` style search on the file, adjusted for private names).
- Every contract cell is a quote with a file and line, or the word `undocumented`.

---

## Phase 2: Apply the Pattern Catalog

### Entry Criteria
- Surface table exists.

### Actions
1. For every row, walk this decision table top to bottom and add one property per matching row. A function may match several rows.

| If | Pattern | Statement template |
|---|---|---|
| Has an inverse partner | Round-trip | `decode(encode(x)) == x` for all valid `x` |
| Output type equals input type | Idempotence | `f(f(x)) == f(x)` |
| Rearranges or filters a collection | Invariant preservation | multiset, length, or sum of the output relates to the input exactly as documented (`sorted(xs)` is a permutation of `xs` and is ordered) |
| Binary operator on one type | Algebraic law | associativity `f(a, f(b, c)) == f(f(a, b), c)`, commutativity, identity `f(a, e) == a`, only where the docs or math guarantee it |
| A reference, older version or brute force exists | Oracle (differential) | `f(x) == ref(x)` after normalizing output form |
| No oracle, but a known input transformation has a known output effect | Metamorphic | `f(t(x))` relates to `f(x)` by relation `R` (search with an extra AND term returns a subset; scaling inputs by k scales a linear output by k; shuffling input does not change a sum) |
| Hard to compute, easy to verify | Verification | `product(factor(n)) == n` and every factor is prime |
| `has_stateful_api` is true | Model | after any sequence of operations, the real object and a simple model give the same observable results |
| Parses or decodes untrusted bytes or text | No-crash | for any input, the function returns or raises only an error in `expected_errors` |

2. For each property, define `input_domain` from the signature and contract: integer bounds, string alphabet (ASCII, full Unicode, no surrogates), collection size limits, float handling (NaN, infinity, negative zero) and encodings. When the contract is silent on a bound, record it as an open question in `preconditions`; do not invent a number.
3. List `expected_errors` only from documentation or explicit `raise`, `throw`, `Err(...)` or `return err` statements in the code. Every other exception is a bug signal.
4. Mark which properties need preconditions (for example a non-empty list, valid UTF-8). Prefer narrowing the domain over filtering later; write the precondition as a domain rule.

### Output
Draft `property_catalog` rows.

### Quality Gate
- Every function in the surface table has at least one row, or a written reason why none applies.
- Every row names exactly one pattern from the table.
- Every row has a `source` that points to a docstring line, spec section or code line.

---

## Phase 3: Reject Weak Properties and Emit the Catalog

### Entry Criteria
- Draft rows exist.

### Actions
1. Delete or rewrite any row that fails these checks:

| Weakness | How to detect | Fix |
|---|---|---|
| Tautology: the test re-implements the function | The assertion would contain the same algorithm as the code under test | Replace with a round-trip, invariant or metamorphic relation |
| Vacuous: passes for a function that returns a constant | Mentally substitute `return []`, `return 0` or `return x` and the property still holds | Add a second property that rules out the constant (round-trip, length preservation) |
| Over-filtered domain | Precondition rejects most random inputs (for example "x is a valid JSON document" drawn from random strings) | Generate the valid structure directly instead of filtering |
| Float equality | Statement uses `==` on floats that went through arithmetic | Use the documented tolerance, or compare on integers or exact rationals; if no tolerance is documented, record an open question |
| Nondeterministic target | Purity flag is false | Inject the clock, seed or I/O as a parameter, or move the property to the model pattern |

2. If `technique` is `fuzz` or `both`, mark every no-crash row and every round-trip over bytes as a fuzz candidate (`fuzz_candidate: true`).
3. If `has_stateful_api` is true, write the model row with the list of operations, the model data structure and the observable results to compare.
4. If `stack` is `python`, you may draft tests with the Hypothesis Ghostwriter to cross-check the catalog: `hypothesis write --roundtrip mymod.encode mymod.decode`, `hypothesis write --idempotent mymod.normalize`, `hypothesis write --equivalent mymod.fast mymod.slow`. It needs `pip install "hypothesis[cli]"`. Treat its output as a draft, not a final test.
5. Emit `property_catalog` as JSON or YAML in the work notes for the next flow.

### Output
Final `property_catalog`.

### Quality Gate
- No row survives the tautology or vacuous check (each row has a one-line note naming which constant function it rules out).
- Every float row names a tolerance source or carries an open question.
- When `has_stateful_api` is true, exactly one model row exists per stateful class.

---

## Worked Example

Illustrative. Input: `target_code` = `src/varint.py::encode, decode`, `stack` = `python`, `technique` = `both`, `has_stateful_api` = false, `spec_notes` = "LEB128 unsigned varint, values 0 to 2**64-1".

Phase 1 surface table:

| Function | Signature | Contract | Partner | Pure |
|---|---|---|---|---|
| `encode` | `(n: int) -> bytes` | "Encode an unsigned 64-bit int as LEB128" (varint.py:4) | `decode` | yes |
| `decode` | `(b: bytes) -> tuple[int, int]` | "Return (value, bytes_consumed); raise ValueError on truncated input" (varint.py:19) | `encode` | yes |

Phase 2 and 3 catalog (excerpt):

```yaml
- id: P1
  pattern: round-trip
  statement: decode(encode(n)) == (n, len(encode(n)))
  input_domain: n integer in [0, 2**64 - 1] (from spec_notes)
  expected_errors: []
  source: spec_notes, varint.py:4
- id: P2
  pattern: invariant-preservation
  statement: every byte of encode(n) except the last has the high bit set; the last does not
  source: LEB128 definition
- id: P3
  pattern: no-crash
  statement: decode(b) for any bytes b returns or raises ValueError only
  expected_errors: [ValueError]
  fuzz_candidate: true
  source: varint.py:19
```

Ghostwriter cross-check: `hypothesis write --roundtrip varint.encode varint.decode` produced a draft with `st.integers()`; the domain was narrowed to `min_value=0, max_value=2**64 - 1` per the spec.

---

## Exit Criteria

DONE when `property_catalog` covers every public function, each row names one pattern with a cited source, weak rows are removed, and fuzz candidates and model rows are flagged as the inputs require.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Symbol in `target_code` not found | **Stop**: report the path and symbol searched; ask for the correct target. |
| Phase 1 | No documentation and no `spec_notes` | **Adjust**: use only round-trip, idempotence, no-crash and model patterns, which need no stated contract, and list each assumed behavior as an open question. |
| Phase 2 | A bound or tolerance is needed but undocumented | **Return**: write it as an open question in `preconditions`; never invent a number. |
| Phase 3 | Every row for a function fails the weakness checks | **Adjust**: fall back to the no-crash pattern for that function and note the gap. |
| Phase 3 | Target is impure and cannot take injected dependencies | **Return**: record that the function needs a refactor to inject time, randomness or I/O before property testing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
