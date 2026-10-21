# Re-Test Fixed Issues with the Original Method

**One-line description:** Re-tests every ranked issue with the same tool, browser, assistive technology and steps that found it, re-runs the full automated scans to catch regressions, and classifies each issue as fixed, still failing, partially fixed or regressed, with evidence that matches the original finding.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ranked_issues` (object[], required): Output of `a11y-impact-ranking`.
- `react_fix_log` (object[], optional): Output of `a11y-react-fix-and-test`, when `stack` is react.
- `vue_fix_log` (object[], optional): Output of `a11y-vue-fix-and-test`, when `stack` is vue.
- `angular_fix_log` (object[], optional): Output of `a11y-angular-fix-and-test`, when `stack` is angular.
- `html_fix_log` (object[], optional): Output of `a11y-html-template-fix-and-validate`, when `stack` is html.
- `site_url` (string, required): URL of the build that contains all fix commits.

---

## Outputs

- `retest_results` (object[]): One row per register entry: `issue_id`, `sc`, `status` (fixed, still-failing, partial, regressed, not-retested), `method` (same as original: axe, lighthouse, pa11y, keyboard, nvda, voiceover-macos, voiceover-ios, contrast measurement, target-size script, reflow script, manual), `evidence` (new output, transcript or measurement), `tested_build` (commit hash or deploy id), `tested_on` (date), plus a summary row listing new issues found by the re-scan.

---

## Phase 1: Confirm the Build Under Test

### Entry Criteria
- At least one fix log has rows with status fixed.

### Actions
1. Read the single fix log that exists (only the one for the project's stack is produced). Collect the commit hashes of all fixed rows.
2. Confirm the deployed build at `site_url` contains them: compare with the deploy's commit id (from the CI deploy log, a `/version` endpoint, or a `<meta name="build">` tag the project exposes). If you run locally, `git log --oneline -n 50` must list every hash and the dev server must be restarted after the last commit.
3. Record `tested_build`.

### Output
A confirmed build id.

### Quality Gate
- Every fixed commit hash is contained in `tested_build` (`git merge-base --is-ancestor <hash> <tested_build>` exits 0 for each).

---

## Phase 2: Re-Test Each Issue the Same Way

### Entry Criteria
- Build confirmed.

### Actions
1. For each register entry, repeat the original method using the evidence in its `evidence` list:

   | Original source | Re-test |
   |---|---|
   | automated (axe, Lighthouse, Pa11y) | rerun that engine on the issue's pages; the rule must be absent for that selector |
   | keyboard | repeat the exact `keys_pressed` from a fresh load |
   | focus | repeat the Tab sequence; re-measure indicator contrast |
   | nvda, voiceover-macos, voiceover-ios | same screen reader, same browser, same keys or gestures; copy the new transcript |
   | contrast | re-measure the same element in every recorded `state` |
   | target-size, reflow | rerun the script for the page and viewport |
   | forms, images, structure, motion, pointer-help | repeat the check row from the original flow's table |

2. Classify:

   | Status | Rule |
   |---|---|
   | fixed | the original check passes on every page in `page_ids` |
   | partial | passes on some pages or states, fails on others |
   | still-failing | the original check fails as before |
   | regressed | was not in the register before and now fails, or the fix broke a different check (found in Phase 3) |
   | not-retested | the method could not be repeated (for example no iOS device); give the reason |

3. A green unit test alone does not make an issue fixed. The original method decides.

### Output
Per-issue statuses.

### Quality Gate
- Every register entry has a status and new evidence of the same type as its original evidence (a transcript for a transcript, a ratio for a ratio).
- No entry is marked fixed with evidence from a different method than the original.

---

## Phase 3: Full Re-Scan for Regressions

### Entry Criteria
- Phase 2 done.

### Actions
1. Rerun the full `a11y-axe-playwright-scan` spec, the `a11y-pa11y-ci-scan` config, and the Lighthouse commands on all inventory pages against `tested_build`.
2. Diff rule ids per page against the original results: `jq -r '.violations[].id' axe-out/P05.json | sort` before and after, then `comm -13 before.txt after.txt` lists new rule ids.
3. Every new rule id on a page becomes a `regressed` row with its own id (RG001, ...), linked to the most recent commit that touched the page's files (`git log -n 1 -- <file>`).
4. Write the summary row: counts of fixed, partial, still-failing, regressed, not-retested.
5. Items that are partial, still-failing or regressed go back to `a11y-fix-plan-by-criterion` for a new task. Do not fix them inside this flow.

### Output
`retest_results`.

### Quality Gate
- The re-scan covered every inventory page (`ls axe-out/*.json | wc -l` equals inventory rows).
- The summary counts add up to the number of register entries plus regressions.

---

## Worked Example

Illustrative only. Register has 3 entries; stack react.

Phase 1: `react_fix_log` lists commits `a1b2c3d` (FX001) and `e4f5a6b` (FX002); the staging `/version` endpoint returns `9f8e7d6`; `git merge-base --is-ancestor a1b2c3d 9f8e7d6` exits 0, same for `e4f5a6b`.
Phase 2:
- K004 size picker: Tab to sizes, Right Arrow selects M. Status fixed.
- C006 Continue button: lightest gradient point now `#1f5fbf` with white text, re-measured ratio above 4.5:1 on P05 and P06, but the hover state still uses the old token on P06. Status partial.
- N004 cart toast: NVDA Speech Viewer now prints "Added to cart". Status fixed.
Phase 3: `comm -13` on P02 shows a new `aria-allowed-attr` violation from the new radio markup (`aria-pressed` left on an input). Row RG001 regressed, linked to commit `a1b2c3d`.

---

## Exit Criteria

DONE when every register entry has a status backed by evidence from its original method on a confirmed build, the full re-scan diff is recorded, and every non-fixed item is listed for a new fix task.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Deployed build does not include all fix commits | **Stop**: wait for the deploy or test locally; re-testing an old build gives false still-failing results. |
| Phase 2 | Original evidence is missing so the method cannot be repeated | **Adjust**: re-run the original flow's check for that SC on that page, and note that the original evidence was missing. |
| Phase 3 | Many new violations from a third-party script added since the audit | **Return**: record them as regressions with the script source; the owner decides whether they are in scope. |

**Do not:** mark an issue fixed because its unit test passes; skip the full re-scan; re-test against a build without the fixes; fix things inside the re-test flow.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
