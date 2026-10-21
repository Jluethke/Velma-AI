# axe-core Scan with Playwright

**One-line description:** Runs axe-core through `@axe-core/playwright` against every row of the page inventory with the WCAG 2.0, 2.1 and 2.2 A and AA rule tags, including pages reached through setup steps, and records violations and "incomplete" (needs review) results separately.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`; each row has `id`, `url`, `state`, `setup_steps`.
- `site_url` (string, required): Base URL prepended to each relative `url`.
- `auth_state` (string, optional): Path to a Playwright storage state JSON file (created with `npx playwright codegen --save-storage=auth.json <site_url>`) for logged-in rows.

---

## Outputs

- `axe_findings` (object[]): One row per violated rule per page: `page_id`, `rule_id`, `impact` (minor, moderate, serious, critical), `wcag_tags` (for example `wcag2aa`, `wcag143`), `help_url`, `nodes` (list of `target` selector arrays with `failureSummary`), `result_type` (`violation` or `incomplete`), `axe_version`.

---

## Phase 1: Install and Pin the Tooling

### Entry Criteria
- Node.js is installed: `node --version` prints a version.
- `page_inventory` has at least one row.

### Actions
1. In a test folder outside the marketplace (for example `<repo_dir>/a11y`), run:
   ```
   npm init -y
   npm install --save-dev @playwright/test @axe-core/playwright
   npx playwright install chromium
   ```
2. Record the exact versions: `npm ls @axe-core/playwright axe-core @playwright/test`. Put the `axe-core` version in every finding as `axe_version`. Rules and tags change between axe-core versions; a result without a version cannot be re-tested fairly.
3. Check that the installed axe-core knows WCAG 2.2 tags: open `node_modules/axe-core/axe.js` and search for `wcag22aa`: `rg -c "wcag22aa" node_modules/axe-core/axe.js`. If the count is 0, the version predates WCAG 2.2 rules; upgrade with `npm install --save-dev axe-core@latest @axe-core/playwright@latest` and re-check.

### Output
Pinned tool versions in `package-lock.json`.

### Quality Gate
- `npm ls @axe-core/playwright` exits 0.
- `rg -c "wcag22aa" node_modules/axe-core/axe.js` prints a number greater than 0.

---

## Phase 2: Write and Run the Scan Spec

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `a11y/scan.spec.ts`. Read the inventory from JSON and make one test per row:
   ```ts
   import { test } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';
   import fs from 'node:fs';

   const rows = JSON.parse(fs.readFileSync('page_inventory.json', 'utf8'));
   const BASE = process.env.SITE_URL!;
   const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

   for (const row of rows) {
     test(`${row.id} ${row.url} [${row.state}]`, async ({ page }) => {
       await page.goto(BASE + row.url, { waitUntil: 'networkidle' });
       // setup steps for non-default states go here, one Playwright call per step
       const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
       fs.mkdirSync('axe-out', { recursive: true });
       fs.writeFileSync(`axe-out/${row.id}.json`, JSON.stringify(results, null, 2));
     });
   }
   ```
2. Translate every `setup_steps` sentence into Playwright calls using role-based locators, for example "click Continue" becomes `await page.getByRole('button', { name: 'Continue' }).click();`. If a step cannot be found by role and name, that is itself a finding for `a11y-forms-error-messaging-audit` or `a11y-keyboard-operability-pass`; fall back to a CSS locator and note it.
3. For logged-in rows, if `auth_state` is given, add `test.use({ storageState: '<auth_state>' })` for those tests.
4. Run: `SITE_URL=<site_url> npx playwright test a11y/scan.spec.ts --reporter=list`. On Windows PowerShell set the variable first: `$env:SITE_URL="<site_url>"`.
5. The test does not assert, on purpose: this run collects data. The CI gate with assertions is built later in `a11y-ci-regression-gate`.

### Output
One `axe-out/<page_id>.json` file per inventory row.

### Quality Gate
- `ls axe-out/*.json | wc -l` equals the number of inventory rows.
- Every file has a `testEngine.version` field: `jq -r .testEngine.version axe-out/*.json` prints one version per file.

---

## Phase 3: Extract Findings

### Entry Criteria
- All result files exist.

### Actions
1. Extract violations and incomplete results with jq:
   ```
   jq -c --arg p P01 '.violations[] | {page_id:$p, rule_id:.id, impact, wcag_tags:[.tags[]|select(startswith("wcag"))], help_url:.helpUrl, nodes:[.nodes[]|{target, failureSummary}], result_type:"violation"}' axe-out/P01.json
   jq -c --arg p P01 '.incomplete[] | {page_id:$p, rule_id:.id, impact, wcag_tags:[.tags[]|select(startswith("wcag"))], help_url:.helpUrl, nodes:[.nodes[]|{target, failureSummary}], result_type:"incomplete"}' axe-out/P01.json
   ```
   Repeat per file, appending to `axe_findings.jsonl`.
2. Read the result arrays this way:

   | Array | Meaning | What to do |
   |---|---|---|
   | `violations` | axe is certain the rule failed | record as `violation` |
   | `incomplete` | axe could not decide (common for `color-contrast` over images or gradients, `aria-valid-attr-value` with dynamic ids) | record as `incomplete`; a human must check it in a later flow |
   | `passes` | rule passed on these nodes | do not record |
   | `inapplicable` | no matching elements | do not record |

3. Map each `wcag_tags` SC tag to the success criterion number: `wcag143` is 1.4.3, `wcag111` is 1.1.1, `wcag258` is 2.5.8, `wcag412` is 4.1.2. The digits are the SC number without dots.

### Output
`axe_findings`.

### Quality Gate
- `jq -s length axe_findings.jsonl` equals the sum of `jq '.violations|length + (.incomplete|length)'` across all files.
- Every row has a non-empty `wcag_tags` list or is a rule with only `best-practice` tags, which must not appear because the scan used WCAG tags only.

---

## Worked Example

Illustrative only. Inventory row P05 (`/checkout/shipping`, state error).

```
$ SITE_URL=https://staging.shop.example npx playwright test a11y/scan.spec.ts --reporter=list
  ok 5 P05 /checkout/shipping [error] (3.1s)
$ jq '.violations[] | {id, impact, n: (.nodes|length)}' axe-out/P05.json
{"id":"label","impact":"critical","n":2}
{"id":"color-contrast","impact":"serious","n":4}
$ jq '.incomplete[] | .id' axe-out/P05.json
"color-contrast"
```
Phase 3 records two `violation` rows (`label` tagged `wcag412`, `color-contrast` tagged `wcag143`) and one `incomplete` row for contrast nodes over a background image.

---

## Exit Criteria

DONE when every inventory row has a stored axe result file with a recorded axe-core version, and every violation and incomplete result is in `axe_findings`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npx playwright install` fails behind a proxy | **Adjust**: set `HTTPS_PROXY` and retry, or use an installed Chrome with `channel: 'chrome'` in `playwright.config.ts`. |
| Phase 2 | Page times out on `networkidle` (long polling, analytics beacons) | **Adjust**: use `waitUntil: 'load'` and then `await page.getByRole('main').waitFor()`. |
| Phase 2 | Setup step element not found | **Retry**: once with a CSS locator; if still missing, **Return** the row to `a11y-scope-inventory` to correct `setup_steps`. |
| Phase 3 | Zero violations on every page | **Adjust**: confirm the scan saw real content by checking `jq '.passes|length'` is greater than 0; a blank page also has zero violations. |

**Do not:** add `.disableRules()` or `.exclude()` to make results smaller; treat zero violations as conformance (automated rules find only a part of WCAG failures); scan only the default state of each page.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
