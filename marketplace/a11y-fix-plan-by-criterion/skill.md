# Fix Plan by Success Criterion

**One-line description:** Turns the ranked issue register into an ordered list of small fix tasks, one root cause per task, each with the source file located, the W3C technique to apply, the failing check that proves the bug, and the test that will prove the fix, so the stack-specific fix flow changes one thing at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ranked_issues` (object[], required): Output of `a11y-impact-ranking`.
- `component_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `repo_dir` (string, required): Front-end source repository.
- `stack` (string, required): `react`, `vue`, `angular`, or `html`.

---

## Outputs

- `fix_plan` (object[]): One task per root cause, in rank order: `task_id` (FX001, ...), `issue_ids`, `sc`, `files` (paths relative to `repo_dir`, one to three files), `technique` (W3C technique id and title), `change` (one sentence, concrete), `reproduce` (the command or manual steps that show the failure now), `verify` (the automated test to add plus the manual re-check), `do_not` (the tempting wrong fix for this case).

---

## Phase 1: Locate the Source of Each Issue

### Entry Criteria
- `ranked_issues` is non-empty.

### Actions
1. For each register entry in rank order, find the file that renders the failing element:
   - If the entry has a component id, use that component's `source_file`.
   - Else search by the most stable part of the selector: id first (`rg -n "id=\"continue\"|id: 'continue'" <repo_dir>/src`), then `data-testid`, then a unique class name, then the visible text.
   - For React, the React Developer Tools "Components" tab shows the component for a selected DOM node; for Vue, Vue DevTools; for Angular, Angular DevTools. Use them when the search is ambiguous.
   - For server templates (`stack` = html), search the templates folder for the class or text, and note template inheritance (`{% extends %}`, `{% include %}`, `<%= render %>`, `@include`).
2. If the cause is global (a reset stylesheet with `outline: none`, a shared `Button` component, the base layout without `lang`), point the task at the global file. One global fix can close many entries.
3. If the element comes from a third-party library, record the package and version: `npm ls <package>`. The task then is either a supported prop or config, a wrapper, or a vendor ticket; never edit `node_modules`.

### Output
Each entry with a source file.

### Quality Gate
- Every entry has at least one file path that exists (`test -f <repo_dir>/<path>`) or a third-party package name and version.

---

## Phase 2: Group into Tasks and Pick Techniques

### Entry Criteria
- Sources located.

### Actions
1. Group entries with the same file and the same `sc` into one task. Never put two different SCs in one task unless one code change fixes both (for example adding a `<label>` fixes 1.3.1, 3.3.2 and 4.1.2 for that field).
2. Keep each task to three files or fewer. If more are needed, split it.
3. Choose the technique from this table and confirm the id at `https://www.w3.org/WAI/WCAG22/Techniques/` before writing it in the task:

   | Failure | Technique |
   |---|---|
   | input without label | H44 Using label elements to associate text labels with form controls |
   | icon button without name | ARIA6 Using aria-label to provide labels for objects, or visually hidden text |
   | name from other visible text | ARIA16 Using aria-labelledby to provide a name for user interface controls |
   | missing alt on informative image | H37 Using alt attributes on img elements |
   | decorative image exposed | H67 Using null alt text and no title attribute on img elements for images that assistive technology should ignore |
   | group of radios or checkboxes | H71 Providing a description for groups of form controls using fieldset and legend elements |
   | error not identified | ARIA21 Using aria-invalid to indicate an error field, plus G83 text descriptions of missing required fields |
   | error not announced | ARIA19 Using ARIA role=alert or Live Regions to identify errors |
   | status message | ARIA22 Using role=status to present status messages |
   | missing autocomplete | H98 Using HTML autocomplete attributes |
   | contrast | G18 (4.5:1 text), G145 (3:1 large text), G207 (3:1 icons) |
   | no skip link | G1 Adding a link at the top of each page that goes directly to the main content area |
   | landmarks | ARIA11 Using ARIA landmarks to identify regions of a page |
   | headings | H42 Using h1-h6 to identify headings |
   | page language | H57 Using the language attribute on the HTML element |
   | page title | H25 Providing a title using the title element |
   | reduced motion | C39 Using the CSS prefers-reduced-motion query to prevent motion |
   | focus hidden by sticky header | C43 Using CSS scroll-padding to un-obscure content |

   If no technique fits, write "no listed technique; fix by meeting the SC text" and quote the SC.
4. Write `do_not` per task from these common wrong fixes:

   | Situation | Wrong fix to forbid |
   |---|---|
   | clickable `div` | adding `role="button"` and `tabindex` without Enter and Space handlers; use a `<button>` |
   | missing label | adding `aria-label` that differs from the visible text (breaks 2.5.3) |
   | contrast | changing the color in one component instead of the design token |
   | focus outline | adding `outline` only on `:focus` with a color that fails 3:1 |
   | axe violation | adding `aria-hidden="true"` to hide the element from the scanner |
   | any | disabling the axe rule, adding `.exclude()`, or deleting the failing test |

### Output
Draft tasks.

### Quality Gate
- Every task has one to three files, one technique id or the "no listed technique" text, and a `do_not` line.
- Every register entry with level A or AA appears in exactly one task's `issue_ids`.

---

## Phase 3: Write Reproduce and Verify Steps

### Entry Criteria
- Draft tasks exist.

### Actions
1. `reproduce`: the exact command or manual steps that show the failure before the change, for example `npx playwright test a11y/scan.spec.ts -g "P05"` then `jq '.violations[].id' axe-out/P05.json` showing `label`, or the NVDA key sequence with the `heard` text.
2. `verify`: the automated test the stack fix flow will add, by stack:

   | `stack` | Test type |
   |---|---|
   | react | jest-axe or vitest-axe component test plus a Testing Library `getByRole` query asserting the name |
   | vue | vitest-axe with `@testing-library/vue` plus `getByRole` |
   | angular | `axe-core` run on the TestBed fixture plus a `getByRole` query from `@testing-library/angular` |
   | html | `html-validate` on the rendered page plus the Playwright axe scan for that page |

   Plus the manual re-check from the original finding (same keys, same screen reader, same measurement).
3. Order tasks by the smallest `rank` among their issues.

### Output
`fix_plan`.

### Quality Gate
- Every task has `reproduce` and `verify` filled with a runnable command or a concrete manual sequence.
- Task order matches ascending minimum rank.

---

## Worked Example

Illustrative only. `stack` = react. Register rank 1: K004 (size picker, 2.1.1, component C07 `src/components/SizePicker.tsx`); rank 2: C006 (Continue button contrast, `src/styles/tokens.css` defines `--color-primary-gradient-start`).

Tasks:
```json
{"task_id":"FX001","issue_ids":["K004","VI002"],"sc":"2.1.1","files":["src/components/SizePicker.tsx"],
 "technique":"no listed technique; follow APG Radio Group pattern with native input type=radio",
 "change":"Replace clickable divs with a fieldset, legend 'Size', and native radio inputs styled as chips",
 "reproduce":"Tab to size options on /products/12, press Space: nothing selected",
 "verify":"SizePicker.test.tsx: axe no violations; getByRole('radio', {name: 'M'}) then userEvent.keyboard('{ArrowRight}') checks next radio",
 "do_not":"Do not add role=button and tabindex to the divs"}
{"task_id":"FX002","issue_ids":["C006","A014"],"sc":"1.4.3","files":["src/styles/tokens.css"],
 "technique":"G18","change":"Darken the gradient start token so white text measures 4.5:1 or more at the lightest point",
 "reproduce":"Measure #ffffff on #5a9cf0: 2.81:1",
 "verify":"Playwright axe scan P05 shows no color-contrast; manual eyedropper at lightest gradient point",
 "do_not":"Do not change the color in the Button component only"}
```

---

## Exit Criteria

DONE when every A and AA register entry is in exactly one task, each task touches three files or fewer, and each has a technique, a reproduce step, a verify step, and a forbidden wrong fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Element cannot be traced to any source file | **Adjust**: search the built bundle for the text or class to find the import path, then map it back to source. |
| Phase 1 | Fix lives in a CMS or content, not code | **Adjust**: make a content task with the CMS field path; verification is the manual re-check. |
| Phase 2 | One task needs more than three files | **Adjust**: split it by file; order the parts so each leaves the build green. |
| Phase 3 | No way to test the issue automatically | **Adjust**: write the manual re-check only and mark "manual verify only"; do not write a test that asserts nothing. |

**Do not:** plan fixes that hide elements from assistive technology; plan rule suppressions; combine unrelated criteria in one task.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
