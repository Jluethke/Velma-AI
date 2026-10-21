# Run the Full Card Once More and Report with Evidence Only

**One-line description:** On DONE, re-runs every verify card level including the full suite on the final tree and compares it with the baseline; on DONE or STOP, writes a short report in which every claim points to a log file or command output (status, goal check result, diff stat, kept and reverted edits, integrity verdict, unverified items, exact next step), with no commit or push unless the user asked.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stop_decision` (object, required): From `stp-stop-or-continue`; `action` is DONE or STOP.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.
- `start_commit` (object, required): From `stp-scratch-log-start`.
- `verify_card` (object, required): From `stp-baseline-capture`.
- `baseline_report` (object, required): From `stp-baseline-capture`.
- `integrity_report` (object, required): From `stp-test-integrity-guard`.
- `unverified_items` (object[], required): From `stp-edit-plan-lock`.
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `final_report` (object): `{ "status": "DONE"|"STOPPED"|"DONE_WITH_REGRESSION", "summary": str, "goal_result": object, "card_results": [object], "new_failures": [str], "diff_stat": str, "edits": [object], "integrity": str, "unverified": [object], "next_step": str, "report_text": str }`.

---

## Phase 1: Final Full Run (DONE only)

### Entry Criteria
- `stop_decision.action` is DONE. (For STOP, skip to Phase 2.)

### Actions
1. Run every card level once on the final tree, using the capture form from `stp-run-verify-capture`, with logs named `final-L0.log` to `final-L4.log`: L0 and L2 for each edited file, L1, L3 for each edited package, then L4 (full suite).
2. Compare L3 and L4 failures with `baseline_report.preexisting_failures`:
   - `new_failures` = failing tests or errors now that were not failing at baseline.
   - Fixed extras = baseline failures that now pass (report them; do not claim them as intended).
3. Set `status`:

| Condition | `status` |
|---|---|
| L1 exit 0 with `must_contain`, every L0/L2 exit 0, `new_failures` empty | DONE |
| L1 passes but `new_failures` non-empty | DONE_WITH_REGRESSION (a regression is a failure of the task; report it first) |
| L1 does not pass on the final run | STOPPED with reason "goal check failed on final run" |

### Output
`card_results`, `new_failures`, `status`.

### Quality Gate
- Every `card_results` entry has an exit code read from the `exit=` line of its `final-*.log`.
- `new_failures` lines each appear in a `final-*.log` and not in any `base-*.log` (`rg -F` on both).

---

## Phase 2: Collect the Evidence

### Entry Criteria
- Phase 1 done, or `action` is STOP.

### Actions
1. `diff_stat`: `git -C <repo_path> diff <start sha> --stat` (staged and unstaged together), minus lines for `start_commit.dirty_files`.
2. `edits`: from `scratch_log`, every EDIT with its final KEEP or REVERT line and attempt count.
3. `goal_result`: the L1 command, its exit code and the last lines of its newest log, copied verbatim.
4. `integrity`: `integrity_report.verdict` plus findings.
5. `unverified`: copy `unverified_items`.
6. For STOP: `status` = STOPPED; take `reason` and `rule` from `stop_decision`.

### Output
Evidence fields.

### Quality Gate
- `goal_result` lines can be found with `rg -F` in a log file under `verify_card.log_dir`.

---

## Phase 3: Write the Report

### Entry Criteria
- Evidence collected.

### Actions
1. Write `report_text` in this order, plain and short:
```
Status: <DONE | DONE_WITH_REGRESSION | STOPPED (rule Rn: reason)>
Goal: <goal_sentence>
Check: <command>  ->  exit <code>, "<must_contain>" <found|not found>   [log: <path>]
Full suite: exit <code>; new failures: <list or none>; baseline failures still failing: <list or none>   [log: <path>]
Changed: <diff_stat>
Edits: E1 kept (1 attempt), E2 kept (1), E3 kept (2; a1 reverted: API_WRONG)
Integrity: <PASS|FAIL> <findings>
Unverified or replaced APIs: <list or none>
Next step: <one concrete action for the user>
Scratch log: <scratch_log path>
```
2. Wording rules:
   - Say "passes" only for a command whose log shows exit 0 and the pass string. Otherwise state the exit code.
   - Never say "should work", "probably", "I believe this fixes". Either a log shows it or the report says it was not verified.
   - For STOPPED, `next_step` names exactly what is needed (a decision, a dependency, a credential, a corrected requirement) and the edit id to resume from.
3. Do not commit, push, open a pull request or delete the scratch log unless the user asked. The staged changes are the deliverable. If the user asked for a commit, the message describes the change and cites the goal check.
4. Append `REPORT <status>` to `scratch_log`.

### Output
`final_report`.

### Quality Gate
- Every line of `report_text` that states a result includes an exit code or a log path.
- `report_text` contains none of: "should work", "probably", "I believe", "seems to".

---

## Worked Example

Illustrative only.

slugkit, `stop_decision` DONE.

```
$ uv run pytest > .git/stp/runs/final-L4.log 2>&1; echo "exit=$?" >> .git/stp/runs/final-L4.log
$ tail -n 3 .git/stp/runs/final-L4.log
FAILED tests/test_cli.py::test_version_flag - AssertionError: assert '0.4.1' in '0.4.0'
1 failed, 42 passed in 0.91s
exit=1
$ git diff 9f2c4e1 --stat -- slugkit tests
 slugkit/core.py       | 3 +++
 tests/test_slugify.py | 5 +++++
 2 files changed, 8 insertions(+)
```

`test_version_flag` failed at baseline too, so `new_failures` is empty and `status` is DONE.

```
Status: DONE
Goal: When slugify is called with 'Crème Brûlée', the program should return 'creme-brulee', but today it returns 'crme-brle'.
Check: uv run pytest tests/test_slugify.py::test_strips_accents -q -> exit 0, "1 passed" found [log: .git/stp/runs/final-L1.log]
Full suite: exit 1; new failures: none; baseline failures still failing: tests/test_cli.py::test_version_flag [log: .git/stp/runs/final-L4.log]
Changed: slugkit/core.py +3, tests/test_slugify.py +5
Edits: E1 kept (1), E2 kept (1), E3 kept (2; a1 reverted: API_WRONG)
Integrity: PASS (42 -> 43 tests)
Unverified or replaced APIs: none
Next step: review the staged diff with `git diff --cached`; the version-flag failure predates this change.
Scratch log: /work/slugkit/.git/stp/scratch.md
```

---

## Exit Criteria

DONE when the report states a status from the table, every result line cites an exit code or log path, and nothing was committed or pushed without the user's request.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Full suite cannot run (tool missing now) | **Return**: STOPPED with reason "environment changed"; include the error line. |
| Phase 1 | New failures appear | **Return**: DONE_WITH_REGRESSION, listing them first; do not edit further in this flow. |
| Phase 2 | `start_commit.sha` is `NO_COMMITS` | **Adjust**: use `git diff --cached --stat` and list new files from `git status --porcelain=v1`. |
| Phase 3 | A claim has no log behind it | **Adjust**: remove the claim or mark it "not verified". |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
