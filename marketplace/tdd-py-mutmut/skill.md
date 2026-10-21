# TDD Python Mutation Testing With mutmut

**One-line description:** Checks the strength of a pytest suite with mutmut by running mutants of the changed modules, reading survived and no-test mutants with mutmut show, and killing each survivor with one new red-first test or recording it as an equivalent mutant with a reason.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Changed production files and suite result from `tdd-refactor-under-green`.
- `coverage_report` (object, required): From `tdd-py-coverage`; used to scope mutation to covered, changed files.

---

## Outputs

- `mutation_report` (object): mutmut version, files mutated, counts per status (killed, survived, no tests, timeout, suspicious, skipped), and the commands run.
- `killing_tests` (object[]): Each new test: mutant name, test name, red evidence with the mutant applied, green evidence after restore.
- `equivalent_mutants` (object[]): Each survivor judged equivalent: mutant name, diff, and the reason no input can tell it apart.

---

## Phase 1: Set Up and Run mutmut

### Entry Criteria
- `python -m pytest -q` passes on a clean working tree (`git status --porcelain` empty, so mutants can be reverted safely).

### Actions
1. Install `python -m pip install mutmut` and check `mutmut --version`. These steps are for mutmut 3.x. mutmut 2.x uses different commands (`mutmut run --paths-to-mutate`); if 2.x is installed, read `mutmut --help` and its docs instead of guessing.
2. Platform: mutmut 3 relies on `fork` and does not run natively on Windows. On Windows, run it inside WSL.
3. mutmut 3 runs tests with pytest only. A unittest suite still works because pytest collects `unittest.TestCase` classes.
4. Add to `pyproject.toml`, limiting mutation to the files changed in this TDD cycle:

```toml
[tool.mutmut]
paths_to_mutate = ["src/shipping/rates.py"]
tests_dir = ["tests/"]
```

Check the mutmut README for the exact config keys of the installed version.
5. Run `mutmut run`. It copies the project into a `mutants/` folder and runs there; add `mutants/` to `.gitignore`.
6. Run `mutmut results` to list mutants that were not killed, grouped by status.

### Output
Mutant run complete with a status list.

### Quality Gate
- `mutmut run` finished and printed its final counts line.
- `mutmut results` output is saved in `mutation_report`.

---

## Phase 2: Read Each Survivor

### Entry Criteria
- At least one mutant not killed. If all were killed, emit the report and finish.

### Actions
1. Read the status meanings:

| Status | Meaning | Next step |
|---|---|---|
| killed | a test failed with the mutant: good | none |
| survived | all tests passed with the mutant: tests do not check this behavior | Phase 3 |
| no tests | no test even runs this code | treat as uncovered code from `tdd-py-coverage`: missing behavior or dead code |
| timeout | mutant made the code loop or hang | usually counts as detected; confirm by `mutmut show` |
| suspicious | run took much longer than baseline | rerun; treat like timeout if it repeats |
| skipped | excluded by config or pragma | none |

2. For each survivor: `mutmut show <mutant name>` prints the diff (for example `-    if weight <= 2:` / `+    if weight < 2:`).
3. Write down what behavior the diff changes, in words ("weight exactly 2 kg is now charged the heavy rate").

### Output
Survivor list with the behavior each one changes.

### Quality Gate
- Every survived mutant has its diff and a one-sentence behavior description.

---

## Phase 3: Kill or Classify

### Entry Criteria
- Survivor list exists.

### Actions
1. Decide per survivor:

| Question | If yes |
|---|---|
| Is there any input where original and mutant return different results or side effects? | write a killing test |
| Is the mutated code unreachable or the result identical for every input (for example `x * 1` to `x / 1`, or a changed default that is always overwritten)? | equivalent mutant |
| Does the requirement not say what should happen at that point? | open question; record, do not invent the behavior |

2. Killing test, one at a time:
   a. Write the test in the main project (not in `mutants/`) asserting the behavior from the requirement (for example `shipping(2) == 4.99`).
   b. Run it on the original code: it must PASS (the original is correct).
   c. Apply the mutant to your source: `mutmut apply <mutant name>`. Run the new test: it must FAIL.
   d. Restore the source: `git restore <file>` (or `git checkout -- <file>`). Run the full suite: green.
   e. Record the red and green output in `killing_tests`.
3. Equivalent mutants: record the diff and the reason. Add `# pragma: no mutate` on that line only if the project allows pragmas.
4. Rerun `mutmut run` (it reruns only what changed) and `mutmut results`. The killed survivors should now be gone from the list.
5. Do NOT delete the mutated code just to remove a survivor unless it is dead code by the coverage classification, and do NOT weaken assertions.

### Output
`mutation_report`, `killing_tests`, `equivalent_mutants`.

### Quality Gate
- Every former survivor is now killed or listed in `equivalent_mutants` with a reason.
- Each killing test has evidence of failing with the mutant applied (step 2c output).
- `git status --porcelain` shows no leftover mutant edits in source files.

---

## Worked Example

Illustrative only. `paths_to_mutate = ["src/shipping/rates.py"]`.

```
$ mutmut run
... 38 mutants: killed 35, survived 3
$ mutmut results
survived:
    shipping.rates.x_shipping__mutmut_4
$ mutmut show shipping.rates.x_shipping__mutmut_4
-    if weight_kg <= 2:
+    if weight_kg < 2:
```

The parametrized test had 1 kg and 2.01 kg but the `at_limit` 2 kg case was dropped in a refactor. Add `pytest.param(2, 4.99, id="at_limit")`. It passes on the original; after `mutmut apply shipping.rates.x_shipping__mutmut_4` it fails with `assert 9.99 == 4.99`; after `git restore src/shipping/rates.py` the suite is green. Rerun shows the mutant killed.

---

## Exit Criteria

DONE when mutmut ran over the changed files, every survivor is killed by a test proven red against that mutant or recorded as equivalent with a reason, and the source tree has no mutant edits left.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | mutmut fails on Windows | **Adjust**: run inside WSL with the same project checkout. |
| Phase 1 | Baseline tests fail inside `mutants/` (files missing) | **Adjust**: add the needed data files to the `also_copy` setting (check the README for the installed version). |
| Phase 3 | Killing test fails on the original code | **Stop**: the test or the code is wrong; return to `tdd-red-one-failing-test` with the requirement. |
| Phase 3 | Mutant cannot be told apart and the requirement is silent | **Return**: record an open question; do not mark it equivalent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
