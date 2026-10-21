# Flat-Memory Soak Proof After the Fix

**One-line description:** Reruns the identical fixed load against the fixed build for at least as many operations as the failing run, fits the post-GC memory floor against operations with a 95 percent confidence interval, handles bounded-cache plateaus correctly, and issues a `FIXED` or `NOT_FIXED` verdict with before and after bytes per operation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `load_recipe` (object, required): From `leak-intake-load-recipe`. Must be used unchanged.
- `bytes_per_op` (object, required): From `leak-rss-growth-confirm`. The pre-fix slope and interval.
- `leak_fix` (string, required): From `leak-fix-minimal-change`. Branch and commit to deploy.
- `leak_regression_test` (object, required): From `leak-regression-guard-test`. Must show fail-before and pass-after.
- `acceptable_growth_rate` (number, optional): Bytes per operation the owner accepts as flat (for example from an SLO stating the process must run a given number of operations within its memory limit). When absent, the only pass condition is a slope interval containing 0.

---

## Outputs

- `soak_series` (string): Path to the post-fix CSV with the same columns as `growth_series`.
- `leak_verdict` (object): `FIXED` or `NOT_FIXED`, pre-fix and post-fix slope with intervals, plateau level if a bounded structure was introduced, and the evidence lines.

---

## Phase 1: Run the Soak

### Entry Criteria
- `leak_regression_test` shows a failure on pre-fix code and a pass on the fix.
- The fix build is deployed to the same environment class as the failing run (same instance size, same runtime flags, same memory limit).

### Actions
1. Deploy `leak_fix`. Record the commit hash running: from the app's version endpoint, or `git rev-parse HEAD` on the build host.
2. Start the samplers exactly as in `leak-rss-growth-confirm` Phase 1, with the same `sample_interval_s` and the same GC markers.
3. Run `load_recipe` unchanged: same rate, same payloads. Run for at least the same operation count as the pre-fix run; more is better, because a slow leak needs more operations to separate from noise. The owner chooses any extra length.
4. Do not change heap limits, worker counts, or allocator settings between the pre-fix and post-fix runs, unless the fix is the allocator setting itself.

### Output
`soak_series` CSV.

### Quality Gate
- The CSV's final `ops` value is at least the pre-fix run's final `ops` value; both numbers are printed.
- The recorded commit hash equals the `leak_fix` commit.

---

## Phase 2: Fit and Handle Plateaus

### Entry Criteria
- `soak_series` exists.

### Actions
1. Drop warmup rows (same `warmup_ops` as before). Keep floor rows (`gc_marker` set; for `cpp`, window minima).
2. If the fix introduced a bound (cache size, pool size), memory is expected to rise until the bound fills, then stay level. Find the fill point from an app metric (cache `currsize`, pool size) reaching its maximum, and fit only rows after it. Record the plateau level. Without a fill metric, fit the last half of the floor rows and say so in the verdict.
3. Fit with `scipy.stats.linregress` on `ops` vs floor bytes; compute the 95 percent interval with `scipy.stats.t.ppf(0.975, n-2) * stderr`.
4. Print pre-fix and post-fix slopes side by side.

### Output
Post-fix slope, interval and plateau.

### Quality Gate
- The `linregress` output line (slope, stderr, n) is saved, and the fit window (all rows after warmup, or after fill point) is stated.

---

## Phase 3: Verdict

### Entry Criteria
- Post-fix fit exists.

### Actions
1. Decide with this table:

   | Post-fix interval | `acceptable_growth_rate` | Verdict |
   |---|---|---|
   | contains 0 | any or absent | `FIXED` |
   | entirely above 0, upper bound at or below `acceptable_growth_rate` | given | `FIXED` (state the accepted residual rate) |
   | entirely above 0, upper bound above `acceptable_growth_rate` | given | `NOT_FIXED` |
   | entirely above 0 | absent | `NOT_FIXED` |

2. For `NOT_FIXED`: compare post-fix with pre-fix slope. If it fell by about the confirmed root cause's per-operation growth, the fix worked and another leak remains: return to `leak-root-cause-confirm` with the remaining growth. If it did not fall, the fix did not take effect: check the deployed commit and configuration first.
3. Never report `FIXED` from a shorter run than the pre-fix run, from a run with a changed load, or from a single before/after RSS reading.
4. Record `leak_verdict` with both slopes, intervals, plateau (if any), commit hash, and the regression test name.

### Output
`leak_verdict`.

### Quality Gate
- The verdict row in the table is cited, and every number in `leak_verdict` appears in saved `linregress` output.

---

## Worked Example

Illustrative only.

Input: pre-fix `bytes_per_op` 401 (interval 362 to 440) over 66,000 ops; `acceptable_growth_rate` absent; fix `a41c9e2` with `maxsize=4096`.

Phase 1: version endpoint reports `a41c9e2`. `k6 run quote.js` at 50/s for 40 minutes; final `ops` 120,000 (pre-fix final 66,000).

Phase 2: the `quote_cache_currsize` metric reaches 1,840 at 9,000 ops and stays there (fewer distinct keys than `maxsize`). Fit floor rows after 9,000 ops: `linregress` prints slope 1.9, stderr 2.6, n 31. t(0.975, 29) = 2.045; interval -3.4 to 7.2 bytes/op.

Phase 3: interval contains 0: `FIXED`. Plateau at about 1.8 MB above warmup level. Regression test `test_price_quote_does_not_retain_carts`.

---

## Exit Criteria

DONE when the post-fix run used the unchanged recipe for at least the pre-fix operation count and the verdict comes from the table with saved fit output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Regression test did not fail on pre-fix code | **Stop**: return to `leak-regression-guard-test`; the guard is not proven. |
| Phase 1 | Deployed commit differs from `leak_fix` | **Retry**: redeploy the correct build before measuring. |
| Phase 3 | `NOT_FIXED` and slope fell partly | **Return**: to `leak-root-cause-confirm` for the remaining growth; loop at most as many times as the chain allows. |
| Phase 3 | `NOT_FIXED` and slope unchanged | **Return**: to `leak-fix-minimal-change`; confirm the fix is on the code path the load exercises. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
