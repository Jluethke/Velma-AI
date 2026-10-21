# Port Edge-Case Input Set

**One-line description:** Builds the list of inputs the golden corpus will be captured from, combining real sample inputs, the boundary values each semantics audit flagged, a fixed type-boundary matrix, and a seeded property-based sample, and checks with branch coverage that the inputs reach every in-scope code path of the original.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`; inputs are written in its typed encoding.
- `integer_findings` (object[], optional): Output of `port-integer-semantics-audit`.
- `float_findings` (object[], optional): Output of `port-float-format-rounding-audit`.
- `unicode_findings` (object[], optional): Output of `port-string-unicode-audit`.
- `sample_inputs` (string, optional): Path to real inputs (request logs, fixture files, recorded CLI invocations) the user is allowed to use.

---

## Outputs

- `case_inputs` (object[]): One row per planned case: `behavior`, `input` (typed encoding), `origin` (sample, audit:<finding id>, matrix, property:<seed>, existing_test:<test id>, coverage_gap:<file:line>), and `tags`.

---

## Phase 1: Collect Inputs From Known Sources

### Entry Criteria
- `corpus_schema` exists.

### Actions
1. Existing tests first: for every in-scope behavior, extract the literal inputs from its existing tests (`rg -n "<function name>\(" tests/`). Each becomes a case with origin `existing_test:<file>::<test name>`.
2. Real samples: if `sample_inputs` is given, take every distinct input shape. Remove personal data the user has not cleared (emails, names, tokens) and say so in the tags.
3. Audit findings: for each row in `integer_findings`, `float_findings`, `unicode_findings`, add one case per listed boundary input or probe string on the behaviors the finding names. Origin `audit:<id>`.
4. Type matrix: for every parameter, add the matrix rows for its type. These values are type boundaries, not tuning choices.

| Parameter type | Values |
|---|---|
| integer | `0`, `1`, `-1`, `2^31 - 1`, `-2^31`, `2^32`, `2^53 - 1`, `2^53 + 1`, `2^63 - 1`, `-2^63`; only values the source accepts, plus one it rejects |
| float | `0.0`, `-0.0`, `0.1`, `0.5`, `2.5`, `-2.5`, `1e16`, `1e21`, `1e-7`, `5e-324`, `1.7976931348623157e308`, `inf`, `-inf`, `nan` |
| string | `""`, `" "`, `"a"`, `"é"`, `"é"`, `"😀"`, `"ß"`, `"İ"`, `"\u0000"`, `"﻿"`, `"a\r\nb"`, `"שלום"`, `"١٢٣"` |
| bytes | empty, `00`, `ff`, `c3 28` (invalid UTF-8), `ef bb bf` (UTF-8 BOM) |
| collection | empty, one element, duplicates, already sorted, reverse sorted, nested empty |
| optional | absent, `null`/`None`, present |
| date-time | `1970-01-01T00:00:00Z`, `1969-12-31T23:59:59Z`, `2024-02-29T12:00:00Z`, `2038-01-19T03:14:08Z`, a nonexistent local time in a DST spring-forward gap (for example `2024-03-10 02:30` in `America/New_York`), an ambiguous local time in the fall-back overlap |
| file path | relative, absolute, with spaces, with non-ASCII, nonexistent |

### Output
Draft `case_inputs`.

### Quality Gate
- Every in-scope behavior has at least one case.
- Every boundary input from every audit finding appears as a case with origin `audit:<id>`.

---

## Phase 2: Add a Seeded Property Sample

### Entry Criteria
- Draft exists.

### Actions
1. Ask the user how many generated cases per behavior they want; record the number. Do not pick one.
2. Generate them with a fixed seed so the set is reproducible:
   - Python source: Hypothesis. Write a test with `@given(...)` and `@settings(derandomize=True, database=None, max_examples=<user number>)` whose body only appends the drawn arguments (typed-encoded) to a JSON Lines file. Run with `pytest -q -p no:randomly path/to/gen_test.py`.
   - JavaScript source: fast-check. `fc.sample(arbitrary, { seed: <seed>, numRuns: <user number> })` returns an array of values; write them out.
   - Java source: jqwik. `@Property(tries = <user number>, seed = "<seed>")` with the body appending arguments to a file.
   - C source: no standard generator; write inputs from a seeded PRNG in a small Python script that emits the C harness's input format, and record the seed.
3. Record the seed and generator version in each case's origin: `property:hypothesis-6.x:derandomize`.
4. Generated inputs must be inputs the source accepts by its documented contract, or deliberate invalid inputs tagged `invalid`. Filter with the source's own validation function, not a guess.

### Output
`case_inputs` with property cases appended.

### Quality Gate
- Running the generator twice produces byte-identical files (`cmp gen1.jsonl gen2.jsonl` exit 0).
- The generated count per behavior equals the user's number.

---

## Phase 3: Close Coverage Gaps

### Entry Criteria
- Phase 2 complete.

### Actions
1. Run the source over all `case_inputs` (a quick driver, or the capture harness in dry mode) under branch coverage:
   - Python: `coverage run --branch driver.py cases.jsonl` then `coverage report --show-missing` (the `Missing` column lists uncovered lines and branch arcs like `12->15`).
   - JavaScript: `npx c8 --reporter=text node driver.mjs cases.jsonl` (`Uncovered Line #s` column).
   - Java: JaCoCo agent `java -javaagent:jacocoagent.jar=destfile=jacoco.exec ...` then `java -jar jacococli.jar report jacoco.exec --classfiles target/classes --sourcefiles src/main/java --html cov/`.
   - C: build with `--coverage`, run, then `gcovr -r . --txt` (or `gcov -b file.c` for branch counts).
2. For each uncovered line or branch in an in-scope file: add a case that reaches it (origin `coverage_gap:<file:line>`), or record why it is unreachable (dead code, platform-specific, defensive check) with the user's confirmation.
3. Rerun coverage and attach the final report.

### Output
Final `case_inputs` with the coverage report.

### Quality Gate
- Every uncovered line or branch in in-scope files is either covered after the rerun or listed with a reason.
- The final coverage report output is attached verbatim.

---

## Worked Example

Illustrative. Behavior B-001 `slugify(text, max_len=80)` in Python.

Phase 1: 29 cases from existing tests, 12 from `unicode_findings` U-001..U-003 probes, 14 matrix strings, 4 matrix integers for `max_len` (`0`, `1`, `-1`, `2^31 - 1`).

Phase 2: user asked for 200 generated texts.
```
$ pytest -q gen/test_gen_slugify.py && cp gen.jsonl gen1.jsonl
$ pytest -q gen/test_gen_slugify.py && cmp gen.jsonl gen1.jsonl; echo $?
0
```
Phase 3:
```
$ coverage run --branch driver.py cases.jsonl && coverage report --show-missing
Name                Stmts   Miss Branch BrPart  Cover   Missing
slugkit/core.py        48      2     22      2    94%   61-62, 58->61
```
Lines 61-62 run only when the text becomes empty after stripping symbols; no case had a symbols-only string. Added case `text="!!!"`, `max_len=80` with origin `coverage_gap:slugkit/core.py:61`; the rerun shows `Missing` empty for `core.py`, including branch `58->61`.

---

## Exit Criteria

DONE when every in-scope behavior has cases from tests, audits, the type matrix and a reproducible seeded sample, and every uncovered branch in in-scope files is covered or justified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sample inputs contain personal or secret data | **Stop**: get the user's clearance or a scrubbed copy; never commit raw production data into the corpus. |
| Phase 2 | Generator produces inputs the source rejects in a way the contract does not define | **Adjust**: tag them `invalid` and keep them only if the rejection is a documented behavior. |
| Phase 3 | A branch is reachable only through a mocked failure (disk full, network error) | **Adjust**: add a case using the source's own fault injection if it has one; otherwise list it as untested-by-corpus and require a hand-written target test. |
| Phase 3 | Coverage tool not installed | **Adjust**: install it (`pip install coverage`, `npx c8`, JaCoCo, `pip install gcovr`); do not skip the gap check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
