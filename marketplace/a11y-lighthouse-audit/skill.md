# Lighthouse Accessibility Audit

**One-line description:** Runs the Lighthouse CLI accessibility category headless against every default-state URL in the inventory, saves JSON reports, and extracts failing audits with their node selectors plus the list of manual-check audits Lighthouse leaves to a human.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `site_url` (string, required): Base URL for relative inventory URLs.

---

## Outputs

- `lighthouse_findings` (object[]): One row per failing audit per page: `page_id`, `audit_id`, `title`, `selectors` (from `details.items[].node.selector`), `snippets` (from `details.items[].node.snippet`), `lighthouse_version`, `form_factor` (mobile or desktop). Also one row per page listing `manual_audits` (audit ids with `scoreDisplayMode` = `manual`).

---

## Phase 1: Run Lighthouse per URL

### Entry Criteria
- Chrome or Chromium is installed.
- Node.js is installed.

### Actions
1. Install a pinned copy: `npm install --save-dev lighthouse` and record `npx lighthouse --version`.
2. Lighthouse loads a URL fresh and cannot click through `setup_steps`. Use only rows whose `state` is `default`. Non-default states are covered by `a11y-axe-playwright-scan`.
3. Run each URL twice, once per form factor, because mobile emulation changes layout (and so changes contrast, target size, and hidden elements):
   ```
   npx lighthouse "<site_url><url>" --only-categories=accessibility --output=json --output-path=lh-out/<page_id>-mobile.json --chrome-flags="--headless=new" --quiet
   npx lighthouse "<site_url><url>" --only-categories=accessibility --preset=desktop --output=json --output-path=lh-out/<page_id>-desktop.json --chrome-flags="--headless=new" --quiet
   ```
   Mobile is the Lighthouse default; `--preset=desktop` switches to desktop. If a flag is rejected, run `npx lighthouse --help` and use the spelling it lists.
4. For pages behind login, Lighthouse CLI needs a cookie header: `--extra-headers=headers.json` where `headers.json` is `{"Cookie": "<session cookie>"}`. If no test session is available, skip those rows and note it.

### Output
Two JSON reports per default-state row.

### Quality Gate
- `ls lh-out/*.json | wc -l` equals two times the number of default-state rows that are not skipped.
- `jq -r '.runtimeError.code // "none"' lh-out/*.json` prints `none` for every file.

---

## Phase 2: Extract Failing and Manual Audits

### Entry Criteria
- All reports exist without runtime errors.

### Actions
1. List failing audits (binary audits use score 0 for fail and 1 for pass):
   ```
   jq -c '.audits | to_entries[] | select(.value.score==0) | {audit_id:.key, title:.value.title, selectors:[.value.details.items[]?.node.selector], snippets:[.value.details.items[]?.node.snippet]}' lh-out/P01-mobile.json
   ```
2. List manual audits that Lighthouse never scores:
   ```
   jq -r '.audits | to_entries[] | select(.value.scoreDisplayMode=="manual") | .key' lh-out/P01-mobile.json
   ```
   Typical ids: `logical-tab-order`, `focusable-controls`, `interactive-element-affordance`, `managed-focus`, `focus-traps`, `custom-controls-labels`, `custom-controls-roles`, `visual-order-follows-dom`, `offscreen-content-hidden`, `use-landmarks`. These are handed to the manual keyboard, focus, and screen reader flows; do not mark them passed.
3. Read the category score only as a trend number: `jq .categories.accessibility.score lh-out/P01-mobile.json`. The score is a weighted share of passing automated audits. A score of 1 (shown as 100) does not mean the page meets WCAG 2.2 AA; never write that it does.
4. Record `lighthouse_version` from `jq -r .lighthouseVersion` and `form_factor` from `jq -r .configSettings.formFactor`.
5. Compare mobile and desktop rows for the same page. An audit that fails on only one form factor is still a failure; keep both rows.

### Output
`lighthouse_findings`.

### Quality Gate
- For each report, the number of rows extracted equals `jq '[.audits[]|select(.score==0)]|length'` for that file.
- Every row has `lighthouse_version` and `form_factor` set.

---

## Worked Example

Illustrative only. Row P01, `/`.

```
$ npx lighthouse "https://staging.shop.example/" --only-categories=accessibility --output=json --output-path=lh-out/P01-mobile.json --chrome-flags="--headless=new" --quiet
$ jq .categories.accessibility.score lh-out/P01-mobile.json
0.87
$ jq -c '.audits|to_entries[]|select(.value.score==0)|{audit_id:.key, n:(.value.details.items|length)}' lh-out/P01-mobile.json
{"audit_id":"button-name","n":1}
{"audit_id":"link-name","n":3}
{"audit_id":"target-size","n":6}
```
Phase 2 writes three rows, and a manual list of ten audit ids passed to the manual flows. The 0.87 is recorded only as a trend value.

---

## Exit Criteria

DONE when every default-state row has a mobile and desktop report, all failing audits are extracted with selectors, and every page's manual audit list is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `runtimeError.code` is `NO_FCP` or `PAGE_HUNG` | **Retry**: once without `--headless=new`; if it repeats, **Adjust** by testing that row only with `a11y-axe-playwright-scan`. |
| Phase 1 | Login redirect captured instead of the page | **Adjust**: pass a session cookie through `--extra-headers`, or skip and note the row. |
| Phase 2 | `details.items` missing on a failing audit | **Adjust**: record the audit with an empty selector list and find the element with the axe result for the same page. |
| Phase 2 | Scores differ between runs | **Return**: accessibility audits are deterministic for the same DOM; a difference means the page content changed (A/B test, ads). Note the variant and rerun. |

**Do not:** report the Lighthouse score as a conformance level; set a pass threshold on the score; skip the mobile run.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
