# Shrinking and Failure Reproduction

**One-line description:** Runs every property suite produced for the chosen stack, reads each library's shrunk counterexample and seed output, records an exact replay command that fails the same way twice, and fixes poor shrinking (huge or noisy counterexamples) by changing generator shape rather than by hand-trimming inputs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_property_tests` (object[], optional): From `pft-py-hypothesis-strategies`.
- `py_state_machine_tests` (object[], optional): From `pft-py-hypothesis-stateful`.
- `py_health_report` (object[], optional): From `pft-py-hypothesis-health-checks`; lists real failures already seen.
- `node_property_tests` (object[], optional): From `pft-node-fastcheck-properties`.
- `node_model_tests` (object[], optional): From `pft-node-fastcheck-model-based`.
- `rust_property_tests` (object[], optional): From `pft-rust-proptest-properties`.
- `rust_state_machine_tests` (object[], optional): From `pft-rust-proptest-state-machine`.
- `go_property_tests` (object[], optional): From `pft-go-rapid-properties`.
- `hs_property_tests` (object[], optional): From `pft-hs-quickcheck-properties`.
- `jvm_property_tests` (object[], optional): From `pft-jvm-jqwik-properties`.
- `differential_tests` (object[], optional): From `pft-differential-oracle-testing`.
- `stack` (string, required): Which suite to run.

---

## Outputs

- `property_failures` (object[]): One row per distinct failing property: test id, shrunk counterexample, seed or replay token, exact replay command, assertion message, two-run determinism result, and the generator change made if shrinking was poor. Empty when the suite is green.

---

## Phase 1: Run the Suite and Capture Raw Failures

### Entry Criteria
- At least one test list input for `stack` is present.

### Actions
1. Run the full property suite with the command for the stack and save the log:

| `stack` | Command |
|---|---|
| python | `python -m pytest tests/property -q --hypothesis-show-statistics 2>&1 \| tee prop.log` |
| node | `npx vitest run test/property 2>&1 \| tee prop.log` (or `npx jest test/property`) |
| rust | `cargo test 2>&1 \| tee prop.log` |
| go | `go test ./... 2>&1 \| tee prop.log` |
| haskell | `cabal test --test-show-details=direct 2>&1 \| tee prop.log` |
| jvm | `mvn test 2>&1 \| tee prop.log` or `./gradlew test --info 2>&1 \| tee prop.log` |

2. Extract each failure block with the marker for the tool:

| Tool | Failure marker | Shrunk value | Replay data |
|---|---|---|---|
| Hypothesis | `Falsifying example:` (stateful: `state = ...` program) | lines after the marker | `@reproduce_failure('<ver>', b'<blob>')` line when `print_blob=True`; `--hypothesis-seed=<n>` |
| fast-check | `Property failed after N tests` | `Counterexample:` line | `{ seed, path, endOnFailure }` object; `replayPath` for commands |
| proptest | `minimal failing input:` | that line | `cc <hex>` line in `proptest-regressions/<module>.txt` |
| rapid | `[rapid] failed after N tests` | `[rapid] draw <label>: <value>` lines | `-rapid.failfile="testdata/rapid/..."` |
| QuickCheck | `*** Failed! Falsified (after N tests and M shrinks):` | following lines | tasty `--quickcheck-replay='...'` |
| jqwik | `Shrunk Sample` | lines under it | `seed = <n>` |

3. Group failures by test id; one test can print one failure per run.

### Output
Raw failure list.

### Quality Gate
- Every failing test in the log appears in the list (count of markers in `prop.log` equals list length).

---

## Phase 2: Replay Each Failure Twice

### Entry Criteria
- Raw list exists.

### Actions
1. Build the replay command for each failure:

| Tool | Replay |
|---|---|
| Hypothesis | add the printed `@reproduce_failure(...)` decorator temporarily, or run with `--hypothesis-seed=<n>`; the example database also replays the last failure automatically |
| fast-check | pass `{ seed, path, endOnFailure: true }` to `fc.assert` temporarily (or `test.prop(..., { seed, path })`) |
| proptest | rerun `cargo test <name>`; the regression file replays first |
| rapid | `go test -run '^<Test>$' -rapid.failfile=<path> ./<pkg>` |
| QuickCheck | `cabal test --test-options="--pattern '<name>' --quickcheck-replay='<token>'"` |
| jqwik | `@Property(seed = "<n>")` temporarily |

2. Run each replay twice. Record both results.
3. If a replay passes on either run, the target or the test is nondeterministic. Return it to the health-check or stack flow; do not record it as a stable failure.
4. Remove all temporary replay decorators and attributes after recording (`git diff -- tests test` must show none).

### Output
Replay commands with two-run results.

### Quality Gate
- Every recorded failure failed in both replay runs with the same assertion message.
- `grep -rn "reproduce_failure\|seed = \"\|endOnFailure" <test dirs>` shows no leftover temporary replay code.

---

## Phase 3: Judge Shrink Quality and Fix Generator Shape

### Entry Criteria
- Stable failures recorded.

### Actions
1. A counterexample is poorly shrunk if it still contains elements that you can delete by hand and the property still fails. Test this by editing the value in a scratch copy of the test, never by editing the recorded output.
2. When shrinking is poor, change the generator using this table, then rerun and compare:

| Cause | Fix |
|---|---|
| Dependent generation (`flatmap`, `chain`, `prop_flat_map`, `flatMap`) | Draw independent parts and combine with `map`, `builds`, `prop_compose!`, `Combinators.combine` |
| Heavy `filter` | Construct valid values directly |
| QuickCheck type without `shrink` | Define `shrink` (`genericShrink` or by hand) |
| Hash, checksum or length prefix computed before generation | Generate the payload, compute the checksum inside the test |
| Random seed or timestamp drawn as an opaque integer | Generate the meaningful fields instead |

3. Never replace a shrunk counterexample with a hand-made "nicer" one in the record. The record must be what the tool printed.
4. Emit `property_failures`.

### Output
`property_failures`.

### Quality Gate
- Every row has the tool-printed counterexample, replay command and two failing replay results.
- Every generator change is listed with before and after counterexample sizes.

---

## Worked Example

Illustrative. `stack` = `node`. `prop.log` contains:

```text
FAIL test/property/money.prop.test.ts > P6 add is associative
Property failed after 41 tests
{ seed: 977356812, path: "40:3:1:0:0", endOnFailure: true }
Counterexample: [{"cents":1,"currency":"USD"},{"cents":2,"currency":"EUR"},{"cents":0,"currency":"USD"}]
Shrunk 12 time(s)
Got error: CurrencyMismatch
```

Phase 2: replay with `{ seed: 977356812, path: "40:3:1:0:0" }` fails twice with `CurrencyMismatch`. Phase 3: shrinking is fine (three values, each needed). The record notes that the generator mixes currencies while the catalog domain says one currency per expression. That is a test-domain error, returned to `pft-node-fastcheck-properties` and not counted as a target bug.

---

## Exit Criteria

DONE when every failing property has a tool-printed shrunk counterexample, a replay command that failed twice, shrinking problems are fixed in the generator, and no temporary replay code remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No test list for `stack` | **Stop**: run the stack's property flow first. |
| Phase 1 | Suite fails to compile or import | **Stop**: report the build error; it is not a property failure. |
| Phase 2 | Replay passes once | **Return**: send to `pft-py-hypothesis-health-checks` (python) or the stack flow as nondeterministic. |
| Phase 3 | Counterexample is outside the catalog domain | **Return**: the generator is wrong; send to the stack flow to fix the domain. |
| Phase 3 | Generator change hides the failure | **Adjust**: the change narrowed the domain; restore it and try another shape. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
