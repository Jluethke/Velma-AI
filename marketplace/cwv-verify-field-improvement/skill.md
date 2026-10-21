# Field Improvement Verification

**One-line description:** Confirms that a deployed performance fix moved real-user p75 by comparing RUM windows before and after the deploy with the same filters and sample counts, and by reading only CrUX History collection periods that start after the deploy date, since each CrUX period is a 28-day rolling window that blends old and new traffic until it clears the deploy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `field_baseline` (object, required): From `cwv-field-crux-baseline` (pre-deploy).
- `rum_p75_report` (object[], required): From `cwv-rum-p75-analysis` (pre-deploy).
- `post_deploy_rum_export` (string, required): RUM beacons collected after the deploy, same format as the pre-deploy export.
- `crux_api_key` (string, required): CrUX API key.
- `deploy_date` (string, required): Date (YYYY-MM-DD) the fix reached production for all users. If a gradual rollout, the date it reached 100 percent.

---

## Outputs

- `improvement_report` (object[]): Per (metric, template, device): before p75 and n, after p75 and n, change, band before and after, CrUX periods used, and a verdict (`improved`, `no change`, `regressed`, `insufficient data`).

---

## Phase 1: Compare RUM Windows

### Entry Criteria
- `post_deploy_rum_export` covers a period starting on or after `deploy_date`.

### Actions
1. Re-run the exact SQL saved by `cwv-rum-p75-analysis` on the post-deploy export. Same template mapping, same device classes, same filters. Do not change the query between before and after.
2. Exclude the deploy day itself (mixed traffic and cached old assets).
3. Make both windows the same length and cover the same weekdays (traffic mix differs on weekends). Record the dates.
4. Build a before/after table with n and p75 per group.
5. Check the sub-part p75s the fix targeted (for example `resourceLoadDelay` for a priority fix, `processingDuration` for a yield fix). The targeted sub-part should move more than the others; if only an untargeted part moved, the change came from elsewhere (traffic, CDN, another deploy).

### Output
RUM before/after table.

### Quality Gate
- Both windows use the saved SQL text unchanged (diff the two query files: `diff before.sql after.sql` prints only the date range lines).
- Each row shows n for both windows.

---

## Phase 2: Read CrUX After the Window Clears

### Entry Criteria
- Phase 1 done.

### Actions
1. Query the CrUX History API as in `cwv-field-crux-baseline` Phase 3 for the same URLs and form factors.
2. Keep only collection periods whose `firstDate` is on or after `deploy_date`. Periods that start before it blend old and new traffic.
3. If no such period exists yet, the earliest clean period arrives about 28 days after the deploy (the CrUX window length). Record "CrUX pending until the first period with firstDate on or after <deploy_date>" and give the RUM verdict alone.
4. Compare the clean period p75 with the `field_baseline` p75 for the same level (URL or origin). Classify both with the Google thresholds (LCP 2500/4000 ms, INP 200/500 ms, CLS 0.1/0.25).

### Output
CrUX before/after rows or a pending note.

### Quality Gate
- Every CrUX "after" value comes from a period with `firstDate` on or after `deploy_date`, shown in the row.

---

## Phase 3: Assign Verdicts

### Entry Criteria
- RUM table exists; CrUX rows or pending note exist.

### Actions
1. Assign per row:
   | Condition | Verdict |
   |---|---|
   | n in either window below the sample floor used in `cwv-rum-p75-analysis` (or that floor is still an open question and n is very small compared with other groups) | `insufficient data` |
   | After p75 lower and the targeted sub-part lower | `improved` |
   | After p75 higher | `regressed` |
   | Otherwise | `no change` |
2. Do not call a change "significant" without a test. If the user wants statistical confidence, compute a bootstrap confidence interval of the p75 difference (resample beacons with replacement in each window, recompute p75, repeat; the number of resamples is a user choice) and report the interval.
3. For `regressed` rows, name the most recent deploys in the window and return to the matching diagnosis flow.
4. Report whether each page now passes the Core Web Vitals assessment (LCP, INP and CLS all good at p75) in RUM and, when available, in CrUX.

### Output
`improvement_report`.

### Quality Gate
- Every row has one verdict from the table and the numbers that produced it.
- No row claims improvement from a CrUX period that starts before `deploy_date`.

---

## Worked Example

Illustrative only. Fix: LCP priority hints on product pages, `deploy_date` = 2026-09-14.

Phase 1 (RUM, same SQL, two 14-day windows, deploy day excluded):
| Group | Before p75 (n) | After p75 (n) | resourceLoadDelay p75 before / after |
|---|---|---|---|
| LCP product/mobile | 3380 (5980) | 2460 (6120) | 1490 / 310 |

Phase 2: on 2026-10-20 the latest History period starting on or after 2026-09-14 reports LCP p75 2530 ms (needs improvement, close to the line); baseline was 3120.

Phase 3: RUM verdict `improved`, band needs improvement to good. CrUX verdict `improved`, still needs improvement at the URL level; re-check the next weekly period.

---

## Exit Criteria

DONE when RUM before/after p75 are computed with identical SQL and equal windows, CrUX is read only from clean post-deploy periods (or marked pending), and every group has a verdict with its numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Query changed between windows | **Stop**: rerun both windows with one query file. |
| Phase 1 | Another deploy landed inside the after window | **Adjust**: shorten the window to end before it, or record the confound. |
| Phase 2 | No clean CrUX period yet | **Return**: report RUM verdicts and the date CrUX can be re-checked. |
| Phase 3 | Regression found | **Return**: route the group back to its diagnosis flow (`cwv-lcp-subparts-breakdown`, `cwv-inp-interaction-profile` or `cwv-cls-shift-sources`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
