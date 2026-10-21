# CrUX Field Baseline

**One-line description:** Pulls p75 Core Web Vitals field data for each URL and form factor from the Chrome UX Report (CrUX) API and CrUX History API, classifies LCP, INP, CLS, FCP and TTFB against the published Google thresholds, and lists the failing metrics that the rest of the chain must fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `site_url` (string, required): The origin, for example `https://www.example.com`. No path, no trailing slash.
- `page_urls` (string[], required): The page URLs to assess, one per page template (home, product, listing, article). Full URLs as users load them.
- `crux_api_key` (string, required): A Google Cloud API key with the "Chrome UX Report API" enabled.

---

## Outputs

- `field_baseline` (object): Per URL (or origin fallback) and per form factor: p75 for each metric, the histogram densities (good / needs improvement / poor), the `collectionPeriod` first and last date, the source level (`url` or `origin`), plus the History API p75 series.
- `failing_metrics` (object[]): Every (url, form factor, metric) whose p75 is outside the "good" band, with the p75, the band, and the threshold it was compared to.

---

## Phase 1: Query the CrUX API

### Entry Criteria
- `crux_api_key` is set and the Chrome UX Report API is enabled in its Google Cloud project.
- `page_urls` holds at least one full URL.

### Actions
1. Store the key in a shell variable, never in a file that gets committed: `export CRUX_KEY='<crux_api_key>'`.
2. For each URL and each form factor in `PHONE`, `DESKTOP`, send one request:
   ```bash
   curl -s -X POST "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"url": "https://www.example.com/product/123", "formFactor": "PHONE"}' > crux_url_phone_product.json
   ```
   Do NOT pass a `metrics` list on the first call. Without it the API returns every metric it has, so you see the exact metric key names your response uses instead of guessing them.
3. Read the HTTP outcome:
   | Response | Meaning | Next action |
   |---|---|---|
   | JSON with `record.metrics` | URL-level data exists | Keep it, level = `url` |
   | HTTP 404 with "chrome ux report data not found" | URL has too little traffic in CrUX | Retry the same form factor with `{"origin": "<site_url>"}` and set level = `origin` |
   | HTTP 404 on the origin too | Origin has too little traffic | Record "no CrUX data"; the chain must rely on RUM from `cwv-rum-web-vitals-setup` |
   | HTTP 400 | Malformed body or URL | Fix the JSON; check the URL has a scheme |
   | HTTP 403 | Key invalid or API not enabled | **Stop** and fix the key |
4. If the URL redirects (http to https, trailing slash, locale), query the final URL. CrUX keys data by the URL users land on. Check with `curl -sI -o /dev/null -w '%{url_effective}\n' -L <url>`.

### Output
One saved JSON response per (URL or origin, form factor).

### Quality Gate
- Every (URL, form factor) pair has a saved file, or a recorded 404 at both URL and origin level.
- Each saved file contains `record.collectionPeriod.firstDate` and `lastDate`.

---

## Phase 2: Extract p75 and Classify

### Entry Criteria
- Phase 1 files exist.

### Actions
1. List the metric keys you actually received: `jq -r '.record.metrics | keys[]' crux_url_phone_product.json`. Expect names such as `largest_contentful_paint`, `interaction_to_next_paint`, `cumulative_layout_shift`, `first_contentful_paint` and a TTFB key (it has carried an `experimental_` prefix; use the name the response shows). Newer responses may also hold LCP sub-part keys whose names start with `largest_contentful_paint_image_`; keep them for `cwv-lcp-subparts-breakdown` if present.
2. Extract p75 per metric: `jq '.record.metrics | to_entries[] | {metric: .key, p75: .value.percentiles.p75, bins: [.value.histogram[]?.density]}' crux_url_phone_product.json`.
3. Convert types: CLS p75 arrives as a string such as `"0.05"`; parse it as a number. Time metrics are integers in milliseconds.
4. Classify each p75 against the thresholds published by Google on web.dev ("Defining the Core Web Vitals metrics thresholds"; "Time to First Byte"; "First Contentful Paint"). Do not change these numbers:
   | Metric | Good (p75 at or below) | Poor (p75 above) |
   |---|---|---|
   | LCP | 2500 ms | 4000 ms |
   | INP | 200 ms | 500 ms |
   | CLS | 0.1 | 0.25 |
   | FCP | 1800 ms | 3000 ms |
   | TTFB | 800 ms | 1800 ms |
   Between the two columns the band is "needs improvement".
5. A page passes the Core Web Vitals assessment only when LCP, INP and CLS are all "good" at p75. FCP and TTFB are diagnostic, not part of the pass.
6. Append every non-good (URL, form factor, metric) to `failing_metrics`.

### Output
Classified p75 table and `failing_metrics`.

### Quality Gate
- Every p75 in the table can be traced to a `jq` read of a saved file (no hand-typed numbers).
- `failing_metrics` lists every row whose band is not "good"; count it with `jq length` and compare to the table.

---

## Phase 3: Pull the History Series

### Entry Criteria
- Phase 2 table exists.

### Actions
1. For each URL (or origin) that had data, request the history:
   ```bash
   curl -s -X POST "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=$CRUX_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"url": "https://www.example.com/product/123", "formFactor": "PHONE"}' > crux_hist_phone_product.json
   ```
   The History API returns weekly collection periods, each a 28-day rolling window. If you need a set number of periods, check the official CrUX History API docs for the `collectionPeriodCount` field and its allowed range before sending it.
2. Extract the series: `jq '.record.metrics.largest_contentful_paint.percentilesTimeseries.p75s' crux_hist_phone_product.json` and pair it with `.record.collectionPeriods`. Null entries mean that week had too little data; keep them as null, do not fill them.
3. Note the trend for each failing metric: rising, flat or falling over the last periods. A metric that is already falling may reflect a fix shipped earlier.
4. Assemble `field_baseline` with the Phase 2 table, the source level, the collection period and the series.

### Output
`field_baseline`, `failing_metrics`.

### Quality Gate
- `field_baseline` records `collectionPeriod.lastDate` for every row (this date anchors later before/after comparisons).
- Each failing metric has its History series attached, or a note that the History API returned 404.

---

## Worked Example

Illustrative only. Input: `site_url` = `https://shop.example.com`, `page_urls` = [`https://shop.example.com/`, `https://shop.example.com/p/blue-mug`].

Phase 1: the home page returns URL-level data for PHONE and DESKTOP. `/p/blue-mug` returns 404 for PHONE, so the flow retries with `{"origin": "https://shop.example.com", "formFactor": "PHONE"}` and records level = `origin` for that row.

Phase 2:
```text
$ jq '.record.metrics.largest_contentful_paint.percentiles.p75' crux_url_phone_home.json
3120
$ jq -r '.record.metrics.cumulative_layout_shift.percentiles.p75' crux_url_phone_home.json
0.02
$ jq '.record.metrics.interaction_to_next_paint.percentiles.p75' crux_url_phone_home.json
236
```
Classification: LCP 3120 ms = needs improvement; INP 236 ms = needs improvement; CLS 0.02 = good. `failing_metrics` gets two rows for home/PHONE.

Phase 3: the LCP p75 series for the last weeks reads `[2980, 3050, 3090, 3120]`: rising. `field_baseline.home.PHONE.collectionPeriod.lastDate` = the date the response shows.

---

## Exit Criteria

DONE when every (URL, form factor) has a p75 per metric with its band at URL or origin level (or a recorded "no CrUX data"), `failing_metrics` lists every non-good row, and the History series is attached for each failing metric.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | HTTP 403 or "API key not valid" | **Stop**: enable the Chrome UX Report API for the key's project and retry; do not switch to scraping PageSpeed Insights HTML. |
| Phase 1 | HTTP 429 quota exceeded | **Retry**: wait and resend the same request; do not loop without a delay. |
| Phase 1 | No data at URL or origin level | **Return**: record "no CrUX data" and route the chain to RUM (`cwv-rum-web-vitals-setup`) as the field source. |
| Phase 2 | A metric key is absent | **Adjust**: record the metric as "not reported" for that row; never copy a value from another form factor. |
| Phase 3 | History API 404 | **Adjust**: keep the single-period baseline and note that no trend exists. |

---

## Reference Section

### Common mistakes
- Treating the PageSpeed Insights score as field data. The 0 to 100 score is lab (Lighthouse). Field data is the `loadingExperience` block in PSI or the CrUX API.
- Mixing origin-level and URL-level numbers in one comparison without labeling the level.
- Reporting the mean or median. Core Web Vitals are assessed at p75.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
