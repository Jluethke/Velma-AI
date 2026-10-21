# NEES And NIS Filter Consistency Check

**One-line description:** Computes normalized estimation error squared (against ground truth) and normalized innovation squared (from the filter's own innovations), compares their time averages with two-sided chi-square bounds at a user-chosen probability, and states whether the filter's covariance is consistent, overconfident or underconfident.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `estimate_log` (object, required): Output of `loc-filter-bag-replay` (estimate, covariance, innovations).
- `ground_truth_traj` (object, required): Output of `loc-ground-truth-prep`.
- `gate_probability` (number, required): User-chosen two-sided probability for the consistency bounds.

---

## Outputs

- `consistency_report` (object): Time-averaged NEES and NIS per state group and sensor, bounds, verdict (CONSISTENT, OVERCONFIDENT, UNDERCONFIDENT, or NOT_AVAILABLE), plots, and which open-item Q or R entries the verdict points to.

---

## Phase 1: NEES

### Entry Criteria
- Ground truth is independent of the evaluated filter run (see `loc-ground-truth-prep`).

### Actions
1. Associate estimate and ground truth by timestamp (nearest within the estimate period; drop pairs farther apart).
2. For each pair compute the error e on the evaluated states (for example x, y, and yaw if truth has orientation, with yaw wrapped) and the matching block P of the covariance. NEES_k = e^T P^-1 e (use `np.linalg.solve`).
3. Single run, K samples, state dimension n: the time average of NEES times K follows chi-square with K*n degrees of freedom if samples were independent. Bounds: `[chi2.ppf((1-p)/2, K*n)/K, chi2.ppf((1+p)/2, K*n)/K]` with p = `gate_probability` (Bar-Shalom, Li, Kirubarajan 2001, chapter 5).
4. Consecutive samples are correlated, so use samples spaced by at least the error autocorrelation time; compute the autocorrelation of e and choose the spacing from it. State the spacing.

### Output
Average NEES with bounds.

### Quality Gate
- K, n, spacing and the two bounds are printed with the average.

---

## Phase 2: NIS

### Entry Criteria
- `estimate_log` has innovations. If the stack does not expose them (robot_localization), mark NIS NOT_AVAILABLE and skip to Phase 3.

### Actions
1. For each sensor, NIS_k = y^T S^-1 y using the logged `d2` (this needs no ground truth).
2. Average over K updates with spacing as in Phase 1; bounds with m (measurement dimension) instead of n.
3. Plot NIS over time with the per-sample `chi2.ppf(p, m)` line; look for segments where NIS rises together (unmodeled effect such as slip in turns, multipath).

### Output
Average NIS per sensor with bounds.

### Quality Gate
- Each sensor has average NIS, bounds and plot path, or NOT_AVAILABLE with the reason.

---

## Phase 3: Verdict

### Entry Criteria
- Phase 1 and Phase 2 results.

### Actions
1. Verdict per statistic:

   | Average vs bounds | Verdict | Meaning |
   |---|---|---|
   | inside | CONSISTENT | covariance matches actual error |
   | above upper | OVERCONFIDENT | P or S too small: Q or R too small, or a model error |
   | below lower | UNDERCONFIDENT | Q or R too large; filter discards information |

2. For OVERCONFIDENT or UNDERCONFIDENT, list the open-item entries from the `noise_covariances` provenance table that can move, and which way. Do not change entries sourced from measurement or datasheet.
3. If NIS is consistent but NEES is overconfident, suspect the ground truth alignment or an unobservable bias before touching Q.
4. Emit `consistency_report`. The chain loops back to `loc-q-r-derivation` on a non-consistent verdict, up to the loop limit.

### Output
`consistency_report`.

### Quality Gate
- Every verdict quotes its numbers and the table row.

---

## Worked Example

Illustrative. p = 0.95, n = 2 (x, y), spacing 5 s, K = 236. Bounds: `chi2.ppf(0.025, 472)/236 = 1.75`, `chi2.ppf(0.975, 472)/236 = 2.27`. Average NEES 4.9: OVERCONFIDENT. NIS GNSS 1.96 (bounds same at m = 2): CONSISTENT. Per Phase 3 rule 3, check ground truth lever arm first; it was missing; after fixing, NEES 2.1: CONSISTENT.

---

## Exit Criteria

DONE when NEES and NIS (or NOT_AVAILABLE) have averages, bounds and a verdict tied to specific open items.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ground truth not independent | **Stop**: rerun with the reference source excluded from the filter. |
| Phase 1 | P singular for some samples | **Adjust**: drop those samples and report the count. |
| Phase 2 | No innovations | **Return**: NOT_AVAILABLE for NIS; NEES alone decides. |
| Phase 3 | Loop limit reached still inconsistent | **Return**: report the model error suspicion (slip, bias, time offset) to `loc-ekf-model-design`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
