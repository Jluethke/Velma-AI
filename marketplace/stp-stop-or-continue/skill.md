# Decide: Next Edit, Retry, Done, or Stop and Report

**One-line description:** Applies a fixed decision table to the latest edit outcome, the attempt history in the scratch log, the locked plan and the integrity verdict to choose exactly one of NEXT_EDIT, RETRY_EDIT, DONE or STOP, with explicit stop rules for repeated identical errors, the user's attempt limit, scope breaches and environment blockers, so a small model never loops forever or quits early.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_outcome` (object, required): From `stp-keep-or-revert-edit`.
- `locked_plan` (object[], required): From `stp-edit-plan-lock`.
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.
- `integrity_report` (object, required): From `stp-test-integrity-guard`.
- `max_attempts` (integer, optional): The user's limit on attempts per edit. If not given, no numeric limit applies and only the repeated-error rule ends retries.

---

## Outputs

- `stop_decision` (object): `{ "action": "NEXT_EDIT"|"RETRY_EDIT"|"DONE"|"STOP", "next_edit_id": str|null, "retry_note": str|null, "reason": str, "rule": str }`.

---

## Phase 1: Gather the Facts

### Entry Criteria
- `edit_outcome.checkpoint_clean` is true.

### Actions
1. From `scratch_log`, list every KEEP and REVERT line for `edit_outcome.edit_id`, in order. Count attempts for this edit.
2. Take the `first_error` of the last two REVERT lines for this edit, if there are two.
3. Find the next edit in `locked_plan` after the last KEPT edit.
4. Read `integrity_report.verdict`.
5. Read the diagnosis `next_action` and `cause_class` from `edit_outcome`.

### Output
Fact list: attempts, last two errors, next edit id, verdict, cause class.

### Quality Gate
- The attempt count equals the number of `EDIT <id> attempt` lines for this id in `scratch_log` (`rg -c "EDIT <id> attempt" <scratch_log>`).

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Facts gathered.

### Actions
1. Use the first row that matches, top to bottom. Record the row name in `rule`.

| Rule | Condition | `action` |
|---|---|---|
| R1 integrity | `integrity_report.verdict` is FAIL | STOP |
| R2 environment | `cause_class` is ENVIRONMENT | STOP |
| R3 repeated error | the last two REVERT lines for this edit have the same `first_error` text | STOP |
| R4 attempt limit | `max_attempts` is given and attempts for this edit >= `max_attempts` and the last decision is REVERT | STOP |
| R5 scope | the diagnosis `next_action` needs a file outside the files in `locked_plan`, or a new dependency, credentials, network, schema migration, or a change to a test's expected value | STOP |
| R6 plan wrong | `cause_class` is API_WRONG or PLAN_WRONG | STOP with `reason` "re-plan required", unless the corrected edit has been re-locked by `stp-edit-plan-lock` since the REVERT line, in which case RETRY_EDIT |
| R7 retry | decision REVERT and `cause_class` is EDIT_TEXT_WRONG | RETRY_EDIT with `retry_note` = the diagnosis `next_action` |
| R8 selector | decision KEEP and `cause_class` is TEST_SELECTOR_WRONG | STOP with `reason` "verify card selector wrong; fix card in stp-baseline-capture then resume" |
| R9 done | decision KEEP, the kept edit is the last in `locked_plan`, and `edit_outcome.goal_passed` is true | DONE |
| R10 next | decision KEEP and a next edit exists | NEXT_EDIT with `next_edit_id` |
| R11 fallthrough | none of the above | STOP with `reason` "no rule matched" and the facts |

2. STOP is a normal, correct outcome. It is better to stop with a clear reason than to keep editing without evidence. Do not continue past a STOP by inventing a new plan in this flow.
3. RETRY_EDIT keeps the same `next_edit_id` as the current edit.

### Output
`stop_decision`.

### Quality Gate
- `rule` names exactly one row, and its condition is true given the Phase 1 facts.
- `action` NEXT_EDIT or RETRY_EDIT always has a `next_edit_id` present in `locked_plan`.

---

## Phase 3: Record and Route

### Entry Criteria
- Decision made.

### Actions
1. Append to `scratch_log`: `<UTC time> DECISION <action> rule=<rule> next=<id or none> reason="<reason>"`.
2. Route:
   - NEXT_EDIT or RETRY_EDIT: back to `stp-apply-one-edit` with this `stop_decision`.
   - DONE or STOP: forward to `stp-final-evidence-report`.

### Output
Routed decision.

### Quality Gate
- `scratch_log` ends with a `DECISION` line matching `stop_decision.action`.

---

## Worked Example

Illustrative only.

slugkit, `max_attempts` = 3 (user given).

- After E1 KEEP (expected assertion failure): R10, NEXT_EDIT E2.
- After E2 KEEP: R10, NEXT_EDIT E3.
- After E3 a1 REVERT, `cause_class` API_WRONG because the applied text differed from the locked text: the plan itself was right, so the plan lock is re-run (no change) and logged; R6 then gives RETRY_EDIT for E3.
- After E3 a2 KEEP with `goal_passed` true: E3 is the last edit, R9, DONE.

Log tail:
```
2026-10-20T14:20:05Z DECISION RETRY_EDIT rule=R6 next=E3 reason="re-locked; applied text differed from plan"
2026-10-20T14:22:43Z DECISION DONE rule=R9 next=none reason="last edit kept, L1 passed"
```

A different run where two REVERTs of E2 both had `first_error` `TS2339: Property 'toCurrency' does not exist on type 'number'.` stops with R3.

---

## Exit Criteria

DONE when exactly one action is chosen by a named table row, recorded in the scratch log, and routed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `checkpoint_clean` false | **Stop**: the tree is not at a known checkpoint; report it. |
| Phase 1 | Scratch log missing KEEP/REVERT lines | **Stop**: the history cannot be trusted; report it. |
| Phase 2 | `max_attempts` not given and errors keep changing | **Adjust**: continue under R7; R3 still stops on the first repeat. |
| Phase 3 | Chain loop limit reached by the runner | **Return**: STOP with `reason` "chain loop limit reached" to the final report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
