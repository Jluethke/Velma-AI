# Confirm the Root Cause by Prediction

**One-line description:** Combines the debugger trace, probe bracket and breaking commit into one causal chain from trigger to symptom, then confirms it by making predictions the chain implies (a variant input that should also fail, one that should pass, and the behavior with the suspect line reverted) and running them, so the fix targets the cause and not the symptom.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_debug_trace` (object, optional): From `repro-py-pdb-debugpy-root-cause`.
- `node_debug_trace` (object, optional): From `repro-node-inspect-root-cause`.
- `go_debug_trace` (object, optional): From `repro-go-delve-root-cause`.
- `jvm_debug_trace` (object, optional): From `repro-jvm-jdb-root-cause`.
- `native_debug_trace` (object, optional): From `repro-native-gdb-lldb-root-cause`.
- `instrumentation_findings` (object, required): From `repro-log-assert-instrumentation`.
- `first_bad_commit` (object, optional): From `repro-git-bisect-run`; empty when the bug is not a regression.

---

## Outputs

- `root_cause` (object): The causal chain as numbered links (trigger input, each state change, symptom) with file:line for each, the defect location (the link where code behaves contrary to its contract), the contract source cited, the prediction table with observed results, and a classification of the defect.

---

## Phase 1: Assemble the Chain

### Entry Criteria
- Exactly one debug trace input is non-empty, or `instrumentation_findings` has a bracket.

### Actions
1. Take the defect sentence from the non-empty debug trace and the bracket from `instrumentation_findings`. They must point to the same statement or adjacent statements. If they disagree, the one supported by a printed value at the producing line wins; record the disagreement.
2. Write the chain as numbered links:
   1. Trigger: the minimal input property that matters (for example "first two bytes are FF FE").
   2. Each state change, one per link, with file:line and value.
   3. Symptom: the error signature.
3. Mark the defect link: the first link where the code does something its contract (docstring, spec, type, API docs, comment, or the regression test's expected value) says it must not. Cite the contract text. Links after it are consequences; fixing them would hide the bug.
4. If `first_bad_commit` is non-empty, check that its diff touches the defect link or a line that feeds it (`git show <sha> -- <file>`). If it does not, write that down; the commit may have exposed an older defect instead of creating it.

### Output
Draft chain with defect link.

### Quality Gate
- Every link has a file:line and a value taken from a trace, probe output or command output.
- The defect link cites a contract source by file and line or by document section.

---

## Phase 2: Predict and Test

### Entry Criteria
- Draft chain exists.

### Actions
1. Write three predictions the chain implies, before running anything:

| Prediction | Example |
|---|---|
| P1: a different input with the same trigger property also fails | "A UTF-16 BE file (FE FF) also fails" |
| P2: the same input without the trigger property passes | "The same CSV saved as UTF-8 without BOM passes" |
| P3: undoing the defect link makes the test pass | "Adding the UTF-16 BOM check in `detect_encoding` makes the red test pass" |

2. Run P1 and P2 by editing only the repro input (copy of the minimal repro under `.repro/`), not source.
3. Run P3 as a throwaway experiment: on a scratch branch (`git switch -c repro-experiment`), make the smallest change at the defect link, run the regression test, record the result, then discard: `git switch -` and `git branch -D repro-experiment`. If `first_bad_commit` exists, a second form of P3 is `git revert --no-commit <sha>` on the scratch branch.
4. Record expected versus observed for each.

### Output
Prediction table with observed results.

### Quality Gate
- Each prediction has a command line and its observed exit code or output.
- `git branch --list repro-experiment` prints nothing after cleanup.

---

## Phase 3: Classify and Finalize

### Entry Criteria
- All three predictions run.

### Actions
1. If all three match, the root cause is confirmed. If any prediction fails, return to Phase 1 and revise the chain; do not proceed to a fix.
2. Classify the defect (pick one; it guides the fix and the note):

| Class | Meaning |
|---|---|
| missing-case | Input class not handled (encoding, empty, unicode, negative, zero-value struct) |
| off-by-one | Boundary comparison or index |
| wrong-assumption | Code assumes an order, type, zone or uniqueness the contract does not promise |
| state-lifecycle | Use before init, use after free or close, stale cache |
| concurrency | Race, deadlock, atomicity violation |
| integration | Caller and callee disagree on a contract; dependency behavior changed |
| config | Default or config precedence wrong |

3. Write `root_cause`.

### Output
`root_cause`.

### Quality Gate
- The prediction table shows observed == expected for P1, P2 and P3.
- The class is one of the seven table values.

---

## Worked Example

Illustrative only. Inputs: `py_debug_trace` defect "encoding.py:19 does not recognize UTF-16 LE BOM"; probe bracket same line; `first_bad_commit` = `9be12f0 "importer: auto-detect encoding"`.

- Phase 1: chain: (1) bytes start FF FE; (2) `detect_encoding` encoding.py:19 compares only to `codecs.BOM_UTF8`, returns `'utf-8'`; (3) csv_reader.py:64 stores `'utf-8'`; (4) csv_reader.py:88 decode raises. Defect link 2; contract: docstring "Detects UTF-8 and UTF-16 byte order marks". Commit 9be12f0 introduced `detect_encoding`, matching.
- Phase 2: P1 FE FF input fails (exit 1), P2 plain UTF-8 passes (exit 0), P3 scratch-branch check for `codecs.BOM_UTF16_LE`/`BE` makes the test pass. Scratch branch deleted.
- Phase 3: class missing-case.

---

## Exit Criteria

DONE when the causal chain is written with values, the defect link cites a contract, and all three predictions have been run with matching results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No contract exists for the defect link | **Return**: ask the maintainer what the intended behavior is; record it as an open question rather than inventing one. |
| Phase 1 | Bisect commit does not touch the chain | **Adjust**: record "exposed, not introduced" and keep the defect link from the trace. |
| Phase 2 | P2 also fails | **Retry**: the trigger property is wrong; return to `repro-ddmin-minimize` output and find what else the minimal input needs. |
| Phase 2 | Weak model keeps the P3 experiment as the fix | **Stop**: delete the scratch branch; the fix is written test-first in `repro-minimal-fix`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
