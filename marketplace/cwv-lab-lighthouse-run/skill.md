# Lighthouse Lab Run

**One-line description:** Runs Lighthouse from the CLI with fixed form factor and throttling for several runs per URL, selects the median run, and extracts the LCP element, LCP phase breakdown, TBT, CLS and render-blocking findings from the JSON report by audit id.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): URLs to test, one per page template.
- `form_factor` (string, optional): `mobile` (default) or `desktop`.

---

## Outputs

- `lab_report` (object): Per URL: the median-run JSON path, Lighthouse version, LCP, FCP, TBT, CLS, Speed Index numeric values, and the audit ids found for render-blocking, font display, image delivery and layout shifts.
- `lab_lcp_element` (object): Per URL: the LCP element selector and snippet, the LCP resource URL if any, and the LCP phase table from the report.

---

## Phase 1: Run Lighthouse Reproducibly

### Entry Criteria
- Node.js 18 or newer (`node -v`) and Chrome installed.
- The target URLs are reachable from this machine.

### Actions
1. Record the version: `npx lighthouse --version`.
2. For each URL run 5 times into separate files (5 is the run count Lighthouse documentation suggests for reducing variance; use more if the user asks):
   ```bash
   for i in 1 2 3 4 5; do
     npx lighthouse "https://shop.example.com/p/blue-mug" \
       --only-categories=performance \
       --output=json --output-path="lh_product_$i.json" \
       --chrome-flags="--headless=new" --quiet
   done
   ```
   For `form_factor` = `desktop`, add `--preset=desktop`. Leave the default throttling (simulated) unchanged so runs compare with each other; record "default simulated throttling" in `lab_report`.
3. Do not run Lighthouse from a laptop on battery saver, over VPN, or with other heavy jobs running. CPU contention changes simulated results.
4. Do not run against `localhost` dev servers (`npm run dev`). Dev builds are unminified and include dev tooling; test a production build or the deployed site.

### Output
Five JSON reports per URL.

### Quality Gate
- `ls lh_product_*.json | wc -l` prints 5 for each URL.
- `jq -r '.runtimeError.code // "none"' lh_product_1.json` prints `none` for every file.

---

## Phase 2: Pick the Median Run

### Entry Criteria
- Five valid reports per URL.

### Actions
1. Extract LCP per run:
   ```bash
   for f in lh_product_*.json; do echo "$f $(jq '.audits["largest-contentful-paint"].numericValue' $f)"; done | sort -k2 -n
   ```
2. Take the middle (3rd of 5) line as the median run. Use that one file for all later reads. Do not average audit details across runs.
3. From the median file, read numeric values:
   ```bash
   jq '{lcp: .audits["largest-contentful-paint"].numericValue, fcp: .audits["first-contentful-paint"].numericValue,
        tbt: .audits["total-blocking-time"].numericValue, cls: .audits["cumulative-layout-shift"].numericValue,
        si: .audits["speed-index"].numericValue}' lh_product_3.json
   ```
4. Record the spread (max minus min LCP across runs). If the spread is large relative to the median, say so; lab LCP is noisy.

### Output
Median run file and its metrics.

### Quality Gate
- `lab_report` names the median file and lists all five LCP values used to pick it.

---

## Phase 3: Extract Diagnostics by Audit Id

### Entry Criteria
- Median run chosen.

### Actions
1. Audit ids change across Lighthouse versions (newer versions add "insight" audits and retire older ones). List what this report has: `jq -r '.audits | keys[]' lh_product_3.json | grep -iE "lcp|largest|render-blocking|font|image|layout-shift|cls|third-party|bf-cache|network"`.
2. LCP element: read `largest-contentful-paint-element` if present (`jq '.audits["largest-contentful-paint-element"].details'`). In versions with insight audits, also read `lcp-phases-insight` / `lcp-discovery-insight` if listed. Copy the `selector`, `snippet` and the phase rows (TTFB, load delay, load time/duration, render delay) exactly as printed.
3. Render-blocking: read `render-blocking-resources` or `render-blocking-insight`, whichever exists. Copy each `url` with its `wastedMs` or duration field.
4. Layout shifts: read `layout-shifts` or `cls-culprits-insight`, whichever exists.
5. Fonts and images: read `font-display` / `font-display-insight` and the image audits listed in step 1.
6. TBT is the lab proxy for main-thread blocking during load. It is not INP. Record it, but never report it as INP.
7. Write `lab_lcp_element`. If the LCP element is text (no image URL), set the resource URL to `null`; then resource load delay and duration are zero by definition.

### Output
`lab_report`, `lab_lcp_element`.

### Quality Gate
- Every audit cited exists in the `keys[]` listing from step 1.
- `lab_lcp_element` has a selector copied from the report, not written by hand.

---

## Worked Example

Illustrative only. `npx lighthouse --version` prints `12.8.0`. Median of five LCP values `[3410, 3520, 3590, 3710, 4020]` is run 3 (3590 ms).

```text
$ jq -r '.audits | keys[]' lh_product_3.json | grep -iE "lcp|largest|render"
largest-contentful-paint
largest-contentful-paint-element
lcp-lazy-loaded
render-blocking-resources
$ jq -r '.audits["largest-contentful-paint-element"].details.items[0].items[0].node.selector' lh_product_3.json
main > div.gallery > img
```
Phase table read from the same audit: TTFB 600 ms, Load Delay 1720 ms, Load Time 860 ms, Render Delay 410 ms. `lcp-lazy-loaded` fails: the LCP image has `loading="lazy"`. `render-blocking-resources` lists `/assets/index-9c2e.css`.

---

## Exit Criteria

DONE when each URL has five runs, a named median run, metric values, and diagnostics read only from audit ids present in that report.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `runtimeError` such as `NO_FCP` or `PAGE_HUNG` | **Retry**: rerun once; if it repeats, check the page renders headless (consent walls, bot blocking) and record it. |
| Phase 1 | Chrome not found | **Adjust**: set `CHROME_PATH` to the Chrome binary and rerun. |
| Phase 2 | Spread across runs is very wide | **Adjust**: run more times and take the median; record the spread. |
| Phase 3 | Audit id from these instructions is missing | **Adjust**: use the equivalent id from the step 1 listing; never invent an id. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
