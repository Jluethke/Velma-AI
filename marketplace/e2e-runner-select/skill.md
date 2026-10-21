# E2E Runner Selection: Playwright (Node or Python) or Cypress

**One-line description:** Chooses the end-to-end runner and language (Playwright with Node/TypeScript, Playwright with Python/pytest, or Cypress) from explicit if/then rules about browsers, tabs, origins, iframes, team language and any suite that already exists, and records the decision as the `stack` value later steps branch on.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `critical_journeys` (object[], required): From `e2e-journey-select`.
- `stack` (string, optional): A runner the user already chose: `playwright-node`, `playwright-python` or `cypress`. When given, this flow checks it against the rules instead of choosing.

---

## Outputs

- `runner_decision` (object): `{stack, reasons[], blocking_conflicts[], existing_suite: {runner, spec_count, ci_job}|null, browsers_required[]}`. `stack` is one of `playwright-node`, `playwright-python`, `cypress`.

---

## Phase 1: Detect What Already Exists

### Entry Criteria
- `repo_dir` exists.

### Actions
1. Run these and record the output:
   - `ls package.json pyproject.toml requirements*.txt 2>/dev/null`
   - `grep -E '"(@playwright/test|playwright|cypress)"' package.json`
   - `grep -iE 'pytest-playwright|playwright' pyproject.toml requirements*.txt 2>/dev/null`
   - `ls playwright.config.* cypress.config.* cypress.json 2>/dev/null`
2. Count existing specs: `find . -path ./node_modules -prune -o \( -name "*.spec.ts" -o -name "*.cy.ts" -o -name "*.cy.js" -o -name "test_*.py" \) -print | wc -l`.
3. Check CI for an E2E job: `grep -rlE 'playwright|cypress' .github/workflows .gitlab-ci.yml 2>/dev/null`.
4. Record `existing_suite`. `cypress.json` (no `cypress.config.*`) means Cypress 9 or older; record it, since migrating it is its own task.

### Output
`existing_suite` facts.

### Quality Gate
- Every command in step 1 was run and its output is quoted in the notes.
- `existing_suite` is either null or names a runner, a spec count and a CI job (or "none").

---

## Phase 2: Apply the Decision Rules

### Entry Criteria
- `existing_suite` recorded.

### Actions
1. Read `critical_journeys` and mark which needs apply. Then apply the rules top to bottom; the first rule that fires decides:

| # | If | Then |
|---|---|---|
| 1 | Journeys need Safari/WebKit coverage | Playwright (Cypress WebKit support is marked experimental in its docs). |
| 2 | A journey opens a second tab or popup window and asserts in it | Playwright (Cypress drives one tab). |
| 3 | A journey crosses into a cross-origin iframe (payment field, embedded widget) | Playwright (`frameLocator`); Cypress has no first-class iframe command. |
| 4 | An existing suite is in CI and green on the default branch | Keep its runner. Migration is a separate project. |
| 5 | The team writes the app's tests in Python and has no Node toolchain | `playwright-python`. |
| 6 | Otherwise | `playwright-node` (built-in sharding, trace viewer, visual comparison, parallel workers without a paid service). |

2. Cross-origin navigation in the top-level page (for example redirect to an identity provider) works in both runners; with Cypress note that the steps on the other origin must be wrapped in `cy.origin()`.
3. If the user supplied `stack` and a rule above it conflicts, record the conflict in `blocking_conflicts` with the journey id. Do not override the user; return the conflict for a decision.
4. Record `browsers_required`: `chromium` always; add `firefox` and `webkit` only when a journey or the user requires them.

### Output
`runner_decision`.

### Quality Gate
- `runner_decision.stack` is exactly one of the three allowed strings.
- `reasons` cites the rule number that fired.
- If the user gave `stack`, either it equals the result or `blocking_conflicts` is non-empty.

---

## Worked Example

Illustrative only. `repo_dir=/srv/shop`, no `stack` given.

Phase 1:
```
$ grep -E '"(@playwright/test|playwright|cypress)"' package.json
(no output)
$ ls playwright.config.* cypress.config.* 2>/dev/null
(no output)
```
`existing_suite = null`.

Phase 2: journey `checkout-card` types the card number inside the payment provider's cross-origin iframe. Rule 3 fires.
```json
{"stack": "playwright-node", "reasons": ["rule 3: checkout-card enters card data in a cross-origin iframe"],
 "blocking_conflicts": [], "existing_suite": null, "browsers_required": ["chromium"]}
```

---

## Exit Criteria

DONE when `runner_decision.stack` is set by a cited rule, conflicts with a user choice are listed, and the browsers to install are named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Both Playwright and Cypress suites exist | **Return**: report both spec counts and CI jobs; ask the user which one is authoritative. |
| Phase 2 | Journeys need native mobile app screens | **Stop**: neither runner drives native apps; this domain covers browsers only. |
| Phase 2 | User `stack` conflicts with rule 1, 2 or 3 | **Return**: list the conflict and the journey; wait for the user's decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
