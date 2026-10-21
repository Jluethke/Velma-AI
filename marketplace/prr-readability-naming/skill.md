# PR Readability and Naming Review

**One-line description:** Reviews the changed code for names that mislead or hide units, functions that do more than their name says, nesting and complexity beyond the limits the project's own linters configure, magic values, dead or commented-out code, and comments that restate code instead of explaining why, labeling each item with the right severity so style never blocks a merge on taste alone.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diff_file` (string, required): Saved PR diff.
- `reading_plan` (object[], required): Ordered files from `prr-diff-reading-order`.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `readability_findings` (object[]): Naming, structure and comment findings, written to `<findings_dir>/prr-readability-naming.json`.

---

## Phase 1: Names

### Entry Criteria
- `reading_plan` has at least one `full` file.

### Actions
1. List every identifier the PR introduces or renames (functions, classes, variables, parameters, constants, files).
2. Check each against these rules:

| Rule | Example of a problem | Suggested name |
|---|---|---|
| Name says what it is or does, not how | `data`, `info`, `tmp`, `obj`, `handle()`, `process()` | `unpaid_invoices`, `send_reminder()` |
| Booleans read as yes/no questions | `active`, `flag`, `check` | `is_active`, `has_paid`, `should_retry` |
| Quantities carry units | `timeout`, `size`, `delay` | `timeout_ms`, `size_bytes`, `delay_seconds` |
| Functions that return a value are not named like actions with side effects, and vice versa | `get_user()` that also creates a user | `get_or_create_user()` |
| No misleading names | `user_list` that is a dict; `validate()` that also saves | Rename to the real type or behavior |
| Follows the language and project convention | `camelCase` in Python, `snake_case` exported Go names | PEP 8 for Python, Effective Go mixedCaps, existing project style |
| Consistent with nearby code | `customer` in a module that says `client` everywhere | Use the existing term |

3. Do not demand renames for names that follow the project's existing convention even if you prefer another style.

### Output
Naming issue list.

### Quality Gate
- Every introduced identifier was checked against all seven rules.
- Each issue gives a concrete replacement name.

---

## Phase 2: Structure and Complexity

### Entry Criteria
- Phase 1 complete.

### Actions
1. Find the limits the project already configures. Do not invent thresholds:

| Stack | Where the limit lives |
|---|---|
| Python | Ruff `C901` with `[tool.ruff.lint.mccabe] max-complexity`; Pylint `max-branches`, `max-statements` |
| JS/TS | ESLint rules `complexity`, `max-depth`, `max-lines-per-function`, `max-params` |
| Go | golangci-lint `gocyclo`/`gocognit` `min-complexity`, `funlen` |
| Java | Checkstyle `CyclomaticComplexity`, PMD rules |

   If the linter flow already ran those rules, use its output; if the project configures no limit, do not report numbers. Report only the structural issues below.
2. For each changed function, check:
   - It does one thing its name describes. If describing it needs "and", suggest a split along that "and".
   - Nesting: a conditional nested inside another conditional where an early return (guard clause) for the error or empty case would remove a level.
   - Boolean parameters that switch behavior (`render(page, True)`): suggest two functions or a named option.
   - Magic values: literal numbers or strings with meaning (`if status == 3`, `sleep(86400)`) that should be named constants or enums.
   - Duplicated blocks: the same logic pasted in two changed places (`git diff` shows the same added lines twice).
   - Dead code: unused functions, unreachable branches, commented-out code.
3. Read comments on changed lines: a comment that restates the code (`i += 1  # increment i`) is a nit; a comment that contradicts the code is blocking (it will mislead the next reader); missing "why" on a non-obvious choice is a question.

### Output
Structure issue list.

### Quality Gate
- Every numeric limit cited comes from a named config key in the repository.
- Every changed function has the six checks recorded.

---

## Phase 3: Label and Record

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Label with this table:

| Issue | Label |
|---|---|
| Misleading name (name says something the code does not do) | blocking |
| Comment contradicts code | blocking |
| Commented-out code or dead code added by this PR | suggestion |
| Magic value with business meaning | suggestion |
| Exceeds a limit the project's linter configures (and CI enforces it) | blocking |
| Vague name, missing unit, nesting, boolean parameter | suggestion |
| Pure preference with no rule above | nit, or drop |

2. Group repeated instances: one finding per pattern per file with all line numbers, not one per line.
3. Write `<findings_dir>/prr-readability-naming.json` (fields `flow`, `category`="readability", `file`, `line`, `evidence`, `proposed_label`, `fix` = the replacement name or structure) and validate with `python -m json.tool`.

### Output
`readability_findings`.

### Quality Gate
- No finding is labeled blocking unless it matches a blocking row.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Diff:
```
+def check(u, x=True):
+    # loop over items
+    for i in u.items:
+        if i.s == 3:
+            if x:
+                send(i)
+    time.sleep(30)
```
- Phase 1: `check` does not check, it sends: misleading (blocking), suggest `send_overdue_items`. `u`, `i`, `x`, `s` are vague. `x` is a boolean switch.
- Phase 2: `3` is a magic status: suggest `ItemStatus.OVERDUE`. `30` has no unit: suggest `RETRY_DELAY_SECONDS = 30`. Comment restates the loop: nit. Project config has no complexity limit, so no numeric claim.
- Phase 3: four findings: blocking (misleading name), suggestion (magic values, grouped), suggestion (boolean parameter), nit (comment).

---

## Exit Criteria

DONE when every introduced identifier and changed function is checked, every numeric limit cited comes from repository config, and findings are grouped and labeled by the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Domain term unfamiliar | **Adjust**: ask a `question` instead of proposing a rename. |
| Phase 2 | No linter config exists | **Adjust**: skip numeric limits; report structural issues only. |
| Phase 3 | More than a handful of nits in one file | **Adjust**: merge them into one nit listing all lines, so nits do not bury real issues. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
