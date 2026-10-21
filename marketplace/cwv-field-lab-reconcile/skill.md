# Field and Lab Reconciliation

**One-line description:** Reconciles CrUX and RUM field data with Lighthouse and WebPageTest lab data using explicit rules for why they differ (cache state, interactions, device mix, post-load shifts, 28-day lag), then emits the ordered list of metric workflows to run, with field data deciding what fails and lab data deciding where to look.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `field_baseline` (object, required): From `cwv-field-crux-baseline`.
- `failing_metrics` (object[], required): From `cwv-field-crux-baseline`.
- `rum_p75_report` (object[], required): From `cwv-rum-p75-analysis`.
- `lab_report` (object, required): From `cwv-lab-lighthouse-run`.
- `wpt_findings` (object[], optional): From `cwv-lab-webpagetest-waterfall` when that step ran; otherwise empty.

---

## Outputs

- `diagnosis_plan` (object): Ordered list of (metric, page template, device, workflow flow name, reason), plus a list of field/lab disagreements with the rule that explains each one.

---

## Phase 1: Build the Side-by-Side Table

### Entry Criteria
- `field_baseline` and `lab_report` exist. `rum_p75_report` exists or is explicitly empty (no RUM yet).

### Actions
1. Make one table with a row per (page template, form factor) and columns: CrUX p75 LCP, RUM p75 LCP, Lighthouse median LCP; CrUX p75 INP, RUM p75 INP, Lighthouse TBT; CrUX p75 CLS, RUM p75 CLS, Lighthouse CLS; CrUX p75 TTFB, RUM p75 TTFB.
2. Match form factors: CrUX `PHONE` with Lighthouse `mobile` and RUM `mobile`; `DESKTOP` with `desktop`.
3. Copy numbers from the source outputs only; leave a cell empty when the source has no value.
4. Field is the source of truth for pass/fail. Lab never overrides a field verdict.

### Output
Side-by-side table.

### Quality Gate
- Every non-empty cell names its source output.
- Field verdicts in the table match `failing_metrics` row for row.

---

## Phase 2: Explain Each Disagreement

### Entry Criteria
- Table exists.

### Actions
1. Apply these rules to every row where field and lab land in different bands:
   | Pattern | Rule that explains it | What to do |
   |---|---|---|
   | Field LCP poor, lab LCP good | Lab runs one fast location with a primed CDN; field includes slow devices, far regions, cold caches, and possibly cookie banners or A/B variants the lab does not get | Trust field; use RUM sub-parts and device/region splits to find the slow cohort |
   | Field LCP good, lab LCP poor | Field has repeat visitors with cached assets and bfcache restores; lab is always cold | Trust field; still fix lab-only causes that hurt first visits if `failing_metrics` lists them |
   | Field INP poor, lab TBT low | INP measures real interactions across the whole visit; Lighthouse navigation mode has no interactions | Go to `cwv-inp-interaction-profile`; do not treat a low TBT as "INP fine" |
   | Field CLS poor, lab CLS near zero | Field CLS includes shifts after load (scrolling, late ads, infinite lists, client-side route changes) that a load-only lab run never sees | Go to `cwv-cls-shift-sources` using RUM `largestShiftTarget` |
   | Field TTFB poor, curl/lab TTFB fine | Field includes redirects, cold server or CDN cache misses, far regions | Go to `cwv-lcp-ttfb-reduce` and `cwv-cache-headers-cdn` |
   | CrUX and RUM disagree | CrUX is a 28-day rolling window of Chrome users who opted in; RUM covers your chosen period and all browsers you instrument (INP/LCP only exist in browsers that support them) | Check the RUM period overlaps CrUX `collectionPeriod`; compare Chromium-only RUM rows |
2. If a recent deploy falls inside the CrUX window, record that CrUX blends before and after.
3. If `wpt_findings` is present, attach its waterfall evidence to the matching LCP rows.

### Output
Disagreement list with the rule applied to each.

### Quality Gate
- Every row with mismatched bands has exactly one rule from the table attached, or "unexplained" with the cells quoted.

---

## Phase 3: Emit the Diagnosis Plan

### Entry Criteria
- Disagreements explained.

### Actions
1. For every (metric, template, device) in `failing_metrics` (and RUM rows that fail with an adequate sample), add a plan entry:
   | Failing metric | Workflow flow |
   |---|---|
   | LCP | `cwv-lcp-subparts-breakdown` |
   | INP | `cwv-inp-interaction-profile` |
   | CLS | `cwv-cls-shift-sources` |
   | TTFB alone (LCP good) | `cwv-lcp-ttfb-reduce` |
   | FCP alone | `cwv-render-blocking-resources` |
2. Order entries: Core Web Vitals (LCP, INP, CLS) before diagnostics (FCP, TTFB); within those, poor before needs-improvement; then by template traffic share if RUM provides counts.
3. If no metric fails, emit an empty plan with the reason "all Core Web Vitals good at p75"; the rest of the chain then only adds budgets (`cwv-ci-lighthouse-budget`, `cwv-ci-size-limit-budget`).

### Output
`diagnosis_plan`.

### Quality Gate
- Every row of `failing_metrics` maps to one plan entry (count both with `jq length`).
- Each plan entry names a flow that exists in this chain.

---

## Worked Example

Illustrative only.

| template / factor | CrUX LCP | RUM LCP | LH LCP | CrUX INP | RUM INP | LH TBT | CrUX CLS | LH CLS |
|---|---|---|---|---|---|---|---|---|
| product / mobile | 3120 | 3380 | 3590 | 236 | 312 | 180 | 0.14 | 0.01 |

Phase 2: INP poor with modest TBT: rule "Lighthouse has no interactions". CLS 0.14 field vs 0.01 lab: rule "post-load shifts". Phase 3 plan: (1) LCP product/mobile to `cwv-lcp-subparts-breakdown`; (2) INP product/mobile to `cwv-inp-interaction-profile`; (3) CLS product/mobile to `cwv-cls-shift-sources`.

---

## Exit Criteria

DONE when the side-by-side table exists, every band mismatch has a rule or is marked unexplained, and `diagnosis_plan` covers every failing metric in priority order.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No field data at all (CrUX 404, no RUM) | **Return**: set the plan from lab only, mark every entry "lab-only, unconfirmed", and require RUM before verification. |
| Phase 2 | Disagreement fits no rule | **Adjust**: mark "unexplained" with cells quoted; do not invent a cause. |
| Phase 3 | A failing metric has no matching workflow | **Stop**: report the gap; do not map it to an unrelated flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
