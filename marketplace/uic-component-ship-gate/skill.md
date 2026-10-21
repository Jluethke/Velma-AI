# Component Ship Gate

**One-line description:** Reruns every check for one component from a clean install in one pass (typecheck, lint, unit tests, axe results, Storybook build and story tests, visual regression, size-limit, i18n report, docs build) and issues a PASS or FAIL verdict where every line is backed by a command's exit code or a named report field, never by recollection.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `stack` (string, required): `react`, `vue` or `svelte`.
- `a11y_report` (object, required): From `uic-axe-a11y-check`.
- `visual_report` (object, required): From `uic-visual-regression`.
- `size_report` (object, required): From `uic-bundle-size-check`.
- `i18n_report` (object, required): From `uic-i18n-readiness`.
- `component_docs` (object, required): From `uic-component-docs`.

---

## Outputs

- `ship_verdict` (object): PASS or FAIL, a table of check / command / exit code / evidence, the list of failing checks routed to the flow that owns each, and open questions carried forward.

---

## Phase 1: Clean Install and Static Checks

### Entry Criteria
- All five input reports exist.

### Actions
1. `git status --porcelain`: record it. Uncommitted changes outside the component folder are a FAIL until explained.
2. Clean install with the lockfile: `npm ci` (or `pnpm install --frozen-lockfile`, `yarn install --immutable`). Exit code must be 0.
3. Typecheck by stack:

   | Stack | Command |
   |---|---|
   | react | `npx tsc --noEmit -p .` |
   | vue | `npx vue-tsc --noEmit` |
   | svelte | `npx svelte-check --threshold warning` |

4. Lint: `npx eslint <component_dir> --max-warnings 0`.
5. `grep -rnE "eslint-disable|svelte-ignore|@ts-ignore|@ts-expect-error|it\.skip|test\.skip|describe\.skip|\.only\(" <component_dir>`: any hit is a FAIL unless a recorded reason exists in the reports.

### Output
Static check rows.

### Quality Gate
- Every command above has its exit code recorded.
- Suppression grep result recorded verbatim.

---

## Phase 2: Dynamic Checks

### Entry Criteria
- Static checks recorded (pass or fail; continue to collect all failures).

### Actions
1. Unit and a11y tests: `npx vitest run <component_dir>` (or `npx jest <component_dir>`). Record the summary line.
2. Storybook: `npm run build-storybook`, then the story test command the repo uses (`npx vitest --project=storybook run` with the Vitest addon, or `npx test-storybook --url http://127.0.0.1:6006` against a static server). Record exit codes.
3. Visual: rerun the command recorded in `visual_report` (Playwright in the Docker image, or Chromatic). Record exit code or build status.
4. Size: `npx size-limit`. Exit 0 when a budget exists; when `size_report` says no budget, record the size and carry the open question.
5. Read `a11y_report`: violations empty for every state, manual checks all recorded. Read `i18n_report`: no remaining hardcoded strings. Read `component_docs`: build passed.

### Output
Dynamic check rows.

### Quality Gate
- Every check row has a command and exit code, or a named report field and its value.

---

## Phase 3: Verdict

### Entry Criteria
- All rows collected.

### Actions
1. PASS only if every row passed. Any failing row makes the verdict FAIL.
2. For each failing row, name the owning flow: typecheck/lint to the stack build flow; hooks lint to `uic-react-hooks-lint`; tests to the stack testing flow; a11y to `uic-axe-a11y-check`; visual to `uic-visual-regression`; size to `uic-bundle-size-check`; i18n to `uic-i18n-readiness`; docs to `uic-component-docs`.
3. Copy open questions from all reports into the verdict.
4. Write `ship_verdict`.

### Output
`ship_verdict`.

### Quality Gate
- Verdict is PASS only when the failing list is empty.
- Every failing row names an owning flow.

---

## Worked Example

Illustrative. Vue `AppTabs`.

- Phase 1: `npm ci` exit 0; `npx vue-tsc --noEmit` exit 0; `npx eslint src/components/AppTabs --max-warnings 0` exit 0; suppression grep: no hits.
- Phase 2: `npx vitest run src/components/AppTabs` prints `Tests 15 passed (15)`; `npm run build-storybook` exit 0; Playwright visual in Docker `6 passed`; `npx size-limit` prints `AppTabs Size: 2.7 kB ... limit 4 kB`, exit 0; `a11y_report` violations empty in 5 states.
- Phase 3: verdict PASS; open question carried: "type-ahead reset delay".

---

## Exit Criteria

DONE when every check has fresh evidence from this run and the verdict follows mechanically from it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm ci` fails on lockfile mismatch | **Stop**: report it; do not regenerate the lockfile inside the gate. |
| Phase 1 | Suppression comment found | **Return**: send to the owning flow to fix the cause. |
| Phase 2 | Command flaky (passes on retry) | **Return**: mark FAIL with "flaky"; route to the owning flow; flakiness is a defect. |
| Phase 3 | Pressure to pass with one failing row | **Stop**: the verdict is FAIL; list the row. |

---

## Do Not

- Do not reuse results from earlier runs; rerun everything.
- Do not mark PASS with a failing or skipped check.
- Do not edit component code inside the gate.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
