# ATE And RPE Evaluation With evo

**One-line description:** Computes absolute trajectory error and relative pose error of the estimate against ground truth with `evo_ape` and `evo_rpe`, choosing alignment flags correctly for a globally referenced vehicle filter, and compares runs with `evo_res`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `estimate_log` (object, required): Output of `loc-filter-bag-replay`.
- `ground_truth_traj` (object, required): Output of `loc-ground-truth-prep`.
- `rpe_delta` (object, required): Relative pose error spacing and unit chosen by the user, for example 100 m, or 1 s.

---

## Outputs

- `ate_rpe_report` (object): ATE and RPE statistics (rmse, mean, median, std, min, max), the exact command lines, alignment choice with reason, plots, and saved result archives.

---

## Phase 1: Choose Alignment

### Entry Criteria
- `pip install evo` done; `evo_ape --help` runs.
- Both files are TUM with overlapping time spans.

### Actions
1. Choose flags with this table:

   | Estimate type | Flags | Reason |
   |---|---|---|
   | Map-frame GNSS-fused estimate in the same datum as truth | no `-a` | alignment would hide a global offset the user cares about |
   | Odom-frame or SLAM estimate with arbitrary start frame | `-a` (SE(3) Umeyama) | removes the arbitrary initial frame |
   | Monocular visual estimate | `-a -s` (Sim(3)) | scale unobservable |
   | Evaluating only the first N poses' frame | `--n_to_align N` with `-a` | documented evo option |

2. Association: evo associates by timestamp with `--t_max_diff` (default 0.01 s). If the estimate rate and truth rate differ, set `--t_max_diff` to half the slower period and record it.

### Output
Flag choice.

### Quality Gate
- The table row is recorded with the reason.

---

## Phase 2: Run ATE And RPE

### Entry Criteria
- Flags chosen.

### Actions
1. ATE: `evo_ape tum gt.tum est.tum <flags> -r trans_part -v --plot --plot_mode xy --save_plot ate.pdf --save_results ate.zip`.
2. If truth has orientation: also `-r angle_deg`.
3. RPE: `evo_rpe tum gt.tum est.tum -r trans_part --delta <d> --delta_unit <u> -v --save_results rpe.zip`, where `<u>` is `m` (meters), `f` (frames), `d` (degrees) or `r` (radians) per evo help. Add `--all_pairs` for more samples.
4. Copy the printed statistics block (max, mean, median, min, rmse, sse, std) verbatim.
5. Compare runs: `evo_res ate_*.zip -p --save_table table.csv`.

### Output
Statistics and archives.

### Quality Gate
- The statistics block for each command is pasted from evo output, not retyped from memory.

---

## Phase 3: Interpret

### Entry Criteria
- Statistics available.

### Actions
1. Report rmse with the reference accuracy beside it. An ATE rmse comparable to the reference accuracy means the evaluation cannot resolve the filter's error.
2. Report the worst segment: from the ATE plot colored by error, give the time window of max error and what happened there (tunnel, GNSS outage, sharp turn).
3. RPE per 100 m in percent is a drift figure for odometry; ATE is a global figure. Do not compare one against the other.
4. Do not claim a result meets any standard; report numbers and conditions.

### Output
`ate_rpe_report`.

### Quality Gate
- rmse, worst window and reference accuracy appear together in the report.

---

## Worked Example

Illustrative. Map-frame estimate, no alignment. `evo_ape tum gt.tum est.tum -r trans_part -v` prints `rmse 0.214`, `max 1.873` (at t 640 to 652 s, underpass). `evo_rpe tum gt.tum est.tum -r trans_part --delta 100 --delta_unit m -v` prints `rmse 0.61` (0.61 percent drift per 100 m). Reference accuracy 0.02 m.

---

## Exit Criteria

DONE when ATE and RPE have verbatim evo statistics, an alignment choice with reason, the worst segment explained, and the reference accuracy stated.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "found no matching timestamps" | **Adjust**: check time bases; raise `--t_max_diff` only up to half the slower period. |
| Phase 2 | Huge ATE with no alignment but small with `-a` | **Return**: datum or frame mismatch; go back to `loc-ground-truth-prep`. |
| Phase 2 | `--delta_unit m` errors | **Adjust**: check `evo_rpe --help` for units in the installed version. |
| Phase 3 | ATE near reference accuracy | **Return**: state that the reference limits the result. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
