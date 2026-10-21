# Pa11y CI Scan with HTML_CodeSniffer and axe

**One-line description:** Runs pa11y-ci over the page inventory with both the HTML_CodeSniffer and axe runners, scripting non-default states with Pa11y `actions`, so a second rule engine catches failures axe-core alone misses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `site_url` (string, required): Base URL for relative inventory URLs.

---

## Outputs

- `pa11y_findings` (object[]): One row per issue: `page_id`, `runner` (`htmlcs` or `axe`), `code` (for example `WCAG2AA.Principle1.Guideline1_3.1_3_1.F68` or the axe rule id), `type` (`error`, `warning`, `notice`), `selector`, `context` (HTML snippet), `message`, `pa11y_version`.

---

## Phase 1: Write the `.pa11yci` Configuration

### Entry Criteria
- Node.js is installed.
- `page_inventory` exists.

### Actions
1. Install: `npm install --save-dev pa11y-ci` and record `npx pa11y-ci --version`.
2. Create `.pa11yci` (JSON) in the test folder:
   ```json
   {
     "defaults": {
       "standard": "WCAG2AA",
       "runners": ["htmlcs", "axe"],
       "includeWarnings": true,
       "chromeLaunchConfig": { "args": ["--no-sandbox"] }
     },
     "urls": []
   }
   ```
   `WCAG2AA` is the HTML_CodeSniffer standard name. HTML_CodeSniffer rules were written for WCAG 2.0 and 2.1 and do not test the WCAG 2.2 additions (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8). Those are covered by dedicated flows.
3. Do not set `timeout` or `wait` from a guess. Leave the Pa11y defaults. Only if a page fails with a timeout, raise the `timeout` value for that URL and record why.
4. Add one entry to `urls` per inventory row. Default-state rows are plain strings: `"https://staging.shop.example/cart"`. Non-default rows are objects with `actions`:
   ```json
   {
     "url": "https://staging.shop.example/checkout/shipping",
     "actions": [
       "click element #continue",
       "wait for element .field-error to be visible"
     ]
   }
   ```
   Valid action forms are listed in the Pa11y README ("Actions" section): `click element <selector>`, `set field <selector> to <value>`, `check field <selector>`, `uncheck field <selector>`, `screen capture <path>`, `wait for element <selector> to be visible`, `wait for element <selector> to be hidden`, `wait for url to be <url>`, `navigate to <url>`. Use only those forms.

### Output
A `.pa11yci` file with one URL entry per inventory row.

### Quality Gate
- `python -m json.tool .pa11yci` exits 0.
- `jq '.urls|length' .pa11yci` equals the number of inventory rows.

---

## Phase 2: Run and Extract

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run with JSON output: `npx pa11y-ci --config .pa11yci --json > pa11y-out.json`. pa11y-ci exits non-zero when issues exist; that is expected here, so do not treat the exit code as a crash. A crash shows as an error message and an empty or invalid `pa11y-out.json`.
2. Confirm the JSON is valid: `jq '.total, .passes, .errors' pa11y-out.json`.
3. Extract issues per URL:
   ```
   jq -c '.results | to_entries[] | .key as $u | .value[] | {url:$u, runner, code, type, selector, context, message}' pa11y-out.json
   ```
   Map each `url` back to its `page_id` from the inventory.
4. Read the HTML_CodeSniffer `code` this way: `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail` means SC 1.4.3, technique G18, failed. The fourth dotted segment with underscores replaced by dots is the SC number.
5. Treat `type` as follows:

   | `type` | Meaning | Action |
   |---|---|---|
   | `error` | rule failed | record as a finding |
   | `warning` | needs human judgment | record, then verify in the matching manual flow |
   | `notice` | reminder only | do not record (not included unless `includeNotices` is set) |

### Output
`pa11y_findings`.

### Quality Gate
- Row count equals `jq '[.results[][]]|length' pa11y-out.json`.
- Every row has a `page_id` that exists in `page_inventory`.

---

## Worked Example

Illustrative only.

```
$ npx pa11y-ci --config .pa11yci --json > pa11y-out.json
$ jq '.total, .passes, .errors' pa11y-out.json
12
9
7
$ jq -c '.results["https://staging.shop.example/checkout/shipping"][] | {runner, code, type}' pa11y-out.json
{"runner":"htmlcs","code":"WCAG2AA.Principle1.Guideline1_3.1_3_1.H44.NonExistentFragment","type":"error"}
{"runner":"htmlcs","code":"WCAG2AA.Principle3.Guideline3_3.3_3_1.G83","type":"warning"}
{"runner":"axe","code":"label","type":"error"}
```
The H44 error (a `<label for>` pointing to an id that does not exist) was not reported by axe; it is kept as a separate finding for SC 1.3.1.

---

## Exit Criteria

DONE when every inventory row was scanned by both runners and every error and warning is in `pa11y_findings` with its page id.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An action form is rejected ("Failed action") | **Adjust**: rewrite it to one of the documented forms; do not invent new verbs. |
| Phase 2 | Chrome fails to launch in a container | **Adjust**: keep `--no-sandbox` in `chromeLaunchConfig.args` and install the missing system libraries listed in the error. |
| Phase 2 | A URL returns a login page | **Adjust**: add `set field` and `click element` actions to log in with a test account, then `navigate to` the target URL. |
| Phase 2 | `pa11y-out.json` is empty | **Retry**: rerun with output to the console (`npx pa11y-ci --config .pa11yci`) to read the error. |

**Do not:** drop the `htmlcs` runner because it reports more; treat warnings as passes; edit the site to silence rules during the scan.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
