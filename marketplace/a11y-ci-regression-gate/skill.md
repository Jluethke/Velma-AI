# Accessibility Regression Gate in CI

**One-line description:** Adds a CI job that fails a pull request when it introduces new WCAG A or AA violations, using a Playwright plus `@axe-core/playwright` spec over the page inventory with a reviewed baseline of known open issues, an optional pa11y-ci step, and Lighthouse CI assertions on specific audits rather than on a score.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `retest_results` (object[], required): Output of `a11y-retest-verify`; issues still open become the known baseline.
- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `site_url` (string, required): URL the CI job can reach (a preview deploy or a server started in the job).
- `repo_dir` (string, required): Repository path.

---

## Outputs

- `ci_gate_config` (object): Paths and contents summary of the files added: `spec_file` (for example `a11y/gate.spec.ts`), `baseline_file` (`a11y/known-issues.json`), `workflow_file` (for example `.github/workflows/a11y.yml`), `lighthouserc` (path or null), the proof run results (`failed_on_seeded_violation`: true, `passed_on_clean_branch`: true), and the CI run URLs.

---

## Phase 1: Write the Gate Spec with a Reviewed Baseline

### Entry Criteria
- `retest_results` exists; the open items (partial, still-failing, regressed) are known.

### Actions
1. Create `a11y/known-issues.json` listing only the open items: `[{"page_id": "P06", "rule_id": "color-contrast", "target": "#continue:hover", "issue_id": "C006", "ticket": "<tracker id>"}]`. Every entry must have an `issue_id` from the register and a ticket. No wildcard entries.
2. Create `a11y/gate.spec.ts`:
   ```ts
   import { test, expect } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';
   import fs from 'node:fs';
   const rows = JSON.parse(fs.readFileSync('a11y/page_inventory.json', 'utf8'));
   const known = JSON.parse(fs.readFileSync('a11y/known-issues.json', 'utf8'));
   const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
   for (const row of rows.filter((r: any) => r.state === 'default')) {
     test(`a11y ${row.id} ${row.url}`, async ({ page }) => {
       await page.goto(process.env.SITE_URL + row.url);
       const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
       const unexpected = violations.flatMap(v => v.nodes.map(n => ({ rule: v.id, target: n.target.join(' ') })))
         .filter(x => !known.some((k: any) => k.page_id === row.id && k.rule_id === x.rule && k.target === x.target));
       expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
     });
   }
   ```
   Non-default states need their setup steps; copy them from `a11y-axe-playwright-scan`'s spec.
3. The baseline is matched per page, rule and node target. A new node with the same rule on the same page still fails the gate.

### Output
Gate spec and baseline file.

### Quality Gate
- `SITE_URL=<site_url> npx playwright test a11y/gate.spec.ts` passes on the current main branch build.
- Every entry in `known-issues.json` has an `issue_id` present in `retest_results` with status partial, still-failing, or regressed.

---

## Phase 2: Add the CI Workflow

### Entry Criteria
- Phase 1 gate passed locally.

### Actions
1. GitHub Actions example `.github/workflows/a11y.yml`:
   ```yaml
   name: a11y
   on: [pull_request]
   jobs:
     axe:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version-file: '.nvmrc' }
         - run: npm ci
         - run: npx playwright install --with-deps chromium
         - run: npm run build && (npm run start &) && npx wait-on http://localhost:3000
         - run: npx playwright test a11y/gate.spec.ts
           env: { SITE_URL: 'http://localhost:3000' }
   ```
   Adjust the build, start command and port to the project's real scripts (read `package.json` `scripts`). Use the action versions the repository already uses elsewhere if any exist. For GitLab CI or other systems, port the same steps to that system's syntax.
2. Optional pa11y-ci step for HTML_CodeSniffer coverage: `npx pa11y-ci --config .pa11yci` with the URLs pointed at the CI server. Pa11y has no baseline mechanism, so add it only once its current error count on main is zero; otherwise leave it out and note why.
3. Optional Lighthouse CI: `npm install --save-dev @lhci/cli` and `lighthouserc.json`:
   ```json
   { "ci": { "collect": { "url": ["http://localhost:3000/"] },
             "assert": { "assertions": {
               "button-name": "error", "image-alt": "error", "label": "error",
               "link-name": "error", "html-has-lang": "error", "document-title": "error" } } } }
   ```
   Run with `npx lhci autorun`. Assert on named audits that pass on main today. Do not set `categories:accessibility` `minScore` from a guess; if the owner wants a score floor, they supply the number.
4. Make the job a required status check in the repository's branch protection settings (owner action; record whether it was done).

### Output
Workflow file and optional configs.

### Quality Gate
- The workflow runs on a pull request and the axe job's log shows one test per default-state page.

---

## Phase 3: Prove the Gate Catches a Regression

### Entry Criteria
- Workflow merged to a branch.

### Actions
1. On a throwaway branch, add a seeded violation to one page: an `<img src="x.png">` without `alt`, or a `<button></button>` with no text. Open a pull request.
2. The gate must fail and its log must name the rule (`image-alt` or `button-name`) and the page. Record the run URL as `failed_on_seeded_violation`.
3. Revert the seeded change on the same branch; the gate must pass. Record the run URL as `passed_on_clean_branch`.
4. Close the throwaway pull request without merging.

### Output
`ci_gate_config`.

### Quality Gate
- One CI run failed naming the seeded rule, and the next run on the reverted branch passed; both URLs are recorded.

---

## Worked Example

Illustrative only. Next.js app, open item T004 (target size of the promo banner close button on P06, still-failing, waiting on a design change).

Phase 1: `known-issues.json` has one entry: `{"page_id":"P06","rule_id":"target-size","target":".promo-dismiss","issue_id":"T004","ticket":"WEB-812"}`. Local run: `6 passed`.
Phase 3: seeded `<button class="icon"></button>` on `/cart`.
```
a11y P03 /cart
  Error: [ { "rule": "button-name", "target": ".icon" } ]
  Expected: []
1 failed, 5 passed
```
After revert: `6 passed`. Both run URLs recorded.

---

## Exit Criteria

DONE when the gate spec runs in CI on every pull request, the baseline contains only register-tracked open items with tickets, and a seeded violation was shown to fail the gate and its revert to pass it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Gate fails on main because of an item not in `retest_results` | **Return**: send it to `a11y-impact-ranking` as a new issue; do not add it to the baseline without an issue id. |
| Phase 2 | Server not ready when tests start | **Adjust**: use `npx wait-on <url>` or Playwright's `webServer` option in `playwright.config.ts`. |
| Phase 3 | Seeded violation does not fail the gate | **Stop**: the gate is not running the page or the tags; fix the spec before relying on it. |

**Do not:** add rules to `disableRules`; use broad `.exclude()` selectors; add baseline entries without an issue id and ticket; mark the CI job `continue-on-error: true`.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
