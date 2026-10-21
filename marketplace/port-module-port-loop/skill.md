# Port Module Port Loop

**One-line description:** Ports the source one unit at a time in the planned leaf-first order, with a fixed per-unit procedure (read the unit and its rules, write the target file, register it in the replay harness, run the stack's check sequence, fix the port and never the corpus, commit) and a log that records which golden records pass after each unit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_repo` (string, required): Path to the target project.
- `port_order` (object[], required): Output of `port-file-order-plan`.
- `porting_rulebook` (object, required): Output of `port-porting-rulebook`.
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`.

---

## Outputs

- `module_port_log` (object[]): One row per unit: `step`, `files`, `target_files`, `commit` hash, `records_total`, `records_passed`, `records_failed` (ids), `rules_applied` (rule ids), `check_sequence_result` (per command: exit status), and `blocked_reason` when the unit could not be finished.

---

## Phase 1: Prepare the Unit

### Entry Criteria
- `PORTING_RULES.md` is committed in `target_repo`.
- The previous unit's row in `module_port_log` has all records passing, or this is step 1.
- `git status --porcelain` in `target_repo` prints nothing.

### Actions
1. Take the next unit from `port_order`. Do not skip ahead; units later in the order import this one.
2. Read the unit's source files in full. List every function, class and constant they define.
3. Find the rules that apply: `rg -n "<file name>" PORTING_RULES.md` (rules cite source locations) plus every R-IDM rule for constructs the file uses.
4. List the unit's golden records: for each behavior in the unit, `wc -l golden/<B-id>.jsonl`. Record `records_total`.
5. Decide the target file path from the layout rule (Go package directory, TS `src/` path mirroring the source, Kotlin same package as the Java class, Rust module). One source file maps to one target file unless the unit is a cycle.

### Output
Unit worksheet: functions, rules, records, target path.

### Quality Gate
- Every function in the unit appears in the worksheet.
- `records_total` equals the sum of `wc -l` for the unit's behaviors.

---

## Phase 2: Write the Port

### Entry Criteria
- Worksheet complete.

### Actions
1. Write the target file. Port every function in the unit, in source order, following the rules listed in the worksheet. Translate behavior, not syntax: when a rule exists for a construct, use the rule's target form even if a direct translation compiles.
2. Do NOT:
   - edit any file outside this unit's target files, its test files, and the replay registry (one unit per commit);
   - call functions that do not exist yet in the target; if a dependency is missing, the order is wrong, stop and report it;
   - invent library APIs: before using any function from a third-party package, confirm it exists in that package's docs or source (`go doc <pkg>.<Func>`, the package's `.d.ts` in `node_modules`, `cargo doc --open` or docs.rs, the JAR's `javap`);
   - leave `TODO` bodies, `throw new Error("not implemented")`, `panic("todo")`, `todo!()`, or `TODO()` in ported functions; a function is ported fully or not registered.
3. Register each ported function in the replay registry (the `call` string to the target function, with type hints).
4. Port the source's own unit tests for this module if the stack does not let them run unchanged (Java tests run unchanged against Kotlin; C tests run unchanged through FFI; Python and JS tests do not run against Go or TS and must be ported). Ported tests keep every assertion; none is dropped or weakened.

### Output
Target file, registry entry, ported tests.

### Quality Gate
- `rg -n "TODO|not implemented|todo!\(|panic\(\"todo|TODO\(\)" <target files>` prints nothing.
- The count of assertions in ported tests equals the source tests' count for this module (count `assert` / `expect(` / `assertEquals` / `t.Error|t.Fatal` lines on both sides and record both numbers).

---

## Phase 3: Check, Fix, Commit

### Entry Criteria
- Target file written and registered.

### Actions
1. Run `check_sequence` from the rulebook in order. Stop at the first failing command, fix, and rerun from the start of the sequence.
2. For each failing golden record, read the diff and fix the port. Use this table to find the cause quickly:

| Diff looks like | Likely rule section |
|---|---|
| `1` vs `1.0`, exponent form, last digit | R-FLT |
| `-0` vs `0`, NaN vs null | R-FLT and schema |
| wrong value only for negative or huge integers | R-INT |
| wrong value only for non-ASCII strings, or length off by one or two | R-STR |
| error expected, value returned (or the reverse) | R-ERR silent failures |
| same elements, different order | R-IDM sorting or map iteration; check `rules.json` for `unordered` |
| different error category | R-ERR mapping |

3. Fix limit: before the first unit, ask the user how many fix-and-rerun cycles to allow on one record and record the number in the log header; do not choose it yourself. When a record still fails after that many cycles with no change in its diff, stop the unit, set `blocked_reason` with the record id, the diff, and what was tried, and hand it to `port-parity-diff-triage`. Do not continue to the next unit.
4. Run every command in `forbidden_checks`. All must print nothing.
5. Commit: `git add <unit target files> <test files> <registry file> && git commit -m "port <unit>: <passed>/<total> golden records"`.
6. Append the row to `module_port_log` with the commit hash from `git rev-parse HEAD` and the exit status of each command.

### Output
Commit and `module_port_log` row.

### Quality Gate
- `records_passed == records_total` for the unit, read from the replay output (not inferred), or `blocked_reason` is set.
- Every `forbidden_checks` command printed nothing.
- `git show --stat HEAD` lists only the unit's files, tests, and registry.

---

## Worked Example

Illustrative. `stack=py-go`, step 1 of 14: `ledger/money.py`.

Phase 1 worksheet: functions `parse_amount`, `format_amount`, `split_evenly`; rules R-INT-02 (floor division in `split_evenly`), R-FLT-01 (`format_amount` uses `f"{x:.2f}"`), R-ERR-01 (`ValueError` to `ErrInvalidAmount`); records B-010 (61) + B-011 (35) = 96.

Phase 3 first run:
```
$ go test ./internal/golden/ -run 'TestGolden/B-01[01]' -count=1
--- FAIL: TestGolden/B-011/0017
    value mismatch: want "-0.01" got "-0.00"
```
Table row "wrong value only for negative" points to R-INT-02: `split_evenly(-0.03, 2)` used Go truncating division on cents. Fixed with the rule's floor formula.
```
$ go test ./internal/golden/ -run 'TestGolden/B-01[01]' -count=1
ok  	example.com/ledger/internal/golden	0.019s
$ git diff HEAD -U0 | rg "^\+.*(t\.Skip\(|_ = .*err)"
$ git commit -qm "port ledger/money.py: 96/96 golden records"
```

---

## Exit Criteria

DONE when every unit in `port_order` has a commit with all its golden records passing and a clean forbidden-shortcut check, or the loop stopped at a unit with a recorded `blocked_reason`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unit imports something not yet ported | **Return**: to `port-file-order-plan`; the graph is missing an edge. |
| Phase 2 | A rule does not cover a construct in the unit | **Return**: to `port-porting-rulebook` to add the rule, with the source location. |
| Phase 3 | Golden record still fails at the user's fix-cycle limit | **Stop**: set `blocked_reason` and run `port-parity-diff-triage` on that record. |
| Phase 3 | Fix would require editing a golden file or the comparator | **Stop**: forbidden; route to `port-parity-diff-triage`. |
| Phase 3 | A previously passing unit's records now fail | **Stop**: this commit broke it; revert the change to that unit's files and redo the fix within this unit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
