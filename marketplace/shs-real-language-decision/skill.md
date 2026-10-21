# Shell or Real Language Decision

**One-line description:** Decides with an explicit rule table whether a task stays a shell script or moves to Python (or another general-purpose language), citing the Google Shell Style Guide limit and the concrete shell weaknesses the requirements hit, so nobody writes 600 lines of bash that should have been 150 lines of Python.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_requirements` (object, required): Output of `shs-script-requirements-intake`.

---

## Outputs

- `language_decision` (string): `shell` or `python`.
- `decision_evidence` (object[]): Each rule that fired, with the requirement text that triggered it and the rule's source.

---

## Phase 1: Apply the Hard-Switch Rules

### Entry Criteria
- `script_requirements` is present and has `external_commands`, `inputs`, `outputs`.

### Actions
1. Walk this table top to bottom. Each row is a yes/no question answered from `script_requirements`. Record every row that answers yes in `decision_evidence`.

| # | Question | Why shell is the wrong tool |
|---|---|---|
| H1 | Must it parse or build JSON, YAML or XML beyond a single `jq` or `yq` filter? | Shell has no data structures beyond flat strings and arrays; nested data ends in fragile text munging. |
| H2 | Does it need floating-point arithmetic? | Shell arithmetic `$(( ))` is integer only; `bc`/`awk` hops multiply failure points. |
| H3 | Does it need nested data (lists of records, maps of lists)? | bash associative arrays are flat and need bash 4.0, which macOS `/bin/bash` 3.2 lacks. |
| H4 | Must the same code run natively on Windows (no WSL, no Git Bash) and on Linux or macOS? | One Python file runs on all three; shell needs a second PowerShell implementation. |
| H5 | Does it call an HTTP API with auth, pagination or retries? | `curl` plus `jq` loops cannot handle retry and backoff state cleanly. |
| H6 | Does it run work in parallel and aggregate per-item results or errors? | `wait` returns one status at a time; `wait -n` needs bash 4.3. |
| H7 | Does it need unit tests of internal logic, not only end-to-end runs? | Shell functions are testable with bats, but logic-heavy code is far easier to test with pytest. |

2. If `existing_script` was provided, count its lines with `wc -l < "$existing_script"`. The Google Shell Style Guide says a script that is more than 100 lines long, or that uses non-straightforward control flow logic, should be rewritten in a more structured language. Record a row G1 when the count exceeds 100.

### Output
Fired rule list.

### Quality Gate
- Every row H1 to H7 has an explicit yes or no in the working notes.
- G1 is evaluated with a real `wc -l` output when a script exists, or marked not applicable.

---

## Phase 2: Decide

### Entry Criteria
- Rule list complete.

### Actions
1. Apply this rule, with no weighing:
   - If any H row fired: `language_decision` = `python`.
   - Else if G1 fired: `language_decision` = `python`, unless the user has stated the script must stay shell; then `shell` and add a note that the style guide limit is exceeded.
   - Else: `language_decision` = `shell`.
2. When the decision is `shell`, also record the allowed scope: glue that runs other programs, moves files, and checks exit codes. Any later requirement that hits H1 to H7 re-opens this flow.
3. When the decision is `python`, the chain skips the shell flows and runs `shs-port-to-python`.

### Output
`language_decision`, `decision_evidence`.

### Quality Gate
- `language_decision` is exactly `shell` or `python`.
- Every `decision_evidence` entry quotes the requirement text that fired it.

---

## Worked Example

Illustrative only.

Input requirements: "Fetch open incidents from a REST API (paged, token auth), compute mean time to resolve in hours with decimals, post a summary to chat." Platforms: Ubuntu 22.04 and Windows Server 2022 without WSL.

Phase 1 fired rows: H1 (JSON paging), H2 (decimal hours), H4 (native Windows), H5 (paged API with auth).

Phase 2: `language_decision` = `python`; `decision_evidence` = four entries, each quoting the requirement.

Counter-example: "Rotate three log files and restart nginx" fires no row, so `language_decision` = `shell`.

---

## Exit Criteria

DONE when `language_decision` is set by the table rule and every fired row is evidenced.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirements too vague to answer a row | **Return**: send the row question back to the user; do not answer it by assumption. |
| Phase 2 | User insists on shell despite an H row | **Adjust**: record the override and the fired rows in `decision_evidence` so reviewers see the risk. |
| Phase 2 | User insists on a language other than Python | **Adjust**: record it; the port flow's structure (subprocess list args, argparse-style parsing, temp dir context) still applies. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
