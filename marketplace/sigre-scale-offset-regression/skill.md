# Scale and Offset by Linear Regression

**One-line description:** Fits physical = factor * raw + offset on lag-aligned pairs with ordinary least squares, reports R squared, residual RMS and residual pattern, tests whether a rounded factor fits as well within the reference quantization limit, and derives the DBC minimum and maximum.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `aligned_pairs` (object[], required): Output of `sigre-reference-time-align`.
- `typed_fields` (object[], required): Output of `sigre-endianness-signedness-test`.
- `fit_r2_min` (number, required): The minimum coefficient of determination the user accepts for a fit. User chosen; recorded in every result.

---

## Outputs

- `scaled_signals` (object[]): Per field: factor, offset, unit, R squared, residual RMS, residual pattern note, rounded factor (if accepted) with its RMS, DBC min and max, pairs used, and pass or fail against `fit_r2_min`.

---

## Phase 1: Unit Preparation

### Entry Criteria
- Every `aligned_pairs` row points to an existing pairs file.

### Actions
1. Choose the target unit per signal and convert the reference column before fitting. Use exact conversions only:
   - m/s to km/h: multiply by 3.6 (exact: 3600 s per h, 1000 m per km).
   - km/h to mph: divide by 1.609344 (exact by the international mile definition).
2. Exclude stretches where the reference is known to be poor: GPS speed below the receiver's documented low-speed accuracy (read the receiver datasheet; if not stated, keep all and note it), and OBD values repeated because the poll interval is slower than the field (keep only the first pair after each OBD sample).
3. Record the reference resolution `q` (1 km/h for OBD PID 0x0D; for GPS the receiver's reported resolution of the speed field; for manual readings the smallest cluster division).

### Output
Unit-prepared pairs and `q`.

### Quality Gate
- The conversion factor used is one of the exact values above or cited from a standard.
- `q` is recorded with its source.

---

## Phase 2: Fit

### Entry Criteria
- Pairs prepared.

### Actions
1. Save as `~/canre/fit.py` and run `python ~/canre/fit.py work/2C4_moto_3_12_pairs.tsv 3.6 Q`:
   ```
   import sys, numpy as np
   p = np.loadtxt(sys.argv[1]); k = float(sys.argv[2]); q = float(sys.argv[3])
   x, y = p[:, 1], p[:, 2] * k
   a, b = np.polyfit(x, y, 1)
   r = y - (a * x + b); rms = np.sqrt(np.mean(r ** 2))
   r2 = 1 - np.sum(r ** 2) / np.sum((y - y.mean()) ** 2)
   print("factor %.8g offset %.6g r2 %.6f rms %.5g n %d" % (a, b, r2, rms, len(x)))
   lo = np.linspace(x.min(), x.max(), 5)
   print("residual mean by raw quintile:", [round(float(r[(x >= lo[i]) & (x <= lo[i + 1])].mean()), 4) for i in range(4)])
   for c in sorted({float("%.1g" % a), float("%.2g" % a), float("%.3g" % a)}):
       bo = np.mean(y - c * x); rc = np.sqrt(np.mean((y - c * x - bo) ** 2))
       print("rounded factor %g offset %.6g rms %.5g accept %s" % (c, bo, rc, rc - rms <= q / np.sqrt(12)))
   ```
2. Read the output:
   - `r2` compared with `fit_r2_min`: pass or fail.
   - Residual means by quintile: a steady trend (for example rising from negative to positive) means the relation is not linear over the range (wrong bit set, missing high bits, or a non-linear signal); a pattern near zero in every quintile supports a linear fit.
   - Rounded factor: accepted only when its RMS exceeds the free-fit RMS by no more than `q / sqrt(12)`, the standard deviation of uniform quantization error of a reading with step `q`. Otherwise keep the fitted factor.
3. Do not force the offset to zero unless a zero-offset fit is also accepted by the same RMS rule. To test it, compute `np.sqrt(np.mean((y - c * x) ** 2))` for the accepted factor `c` and apply the same `q / sqrt(12)` comparison.

### Output
Fit results per field.

### Quality Gate
- Each field shows the printed `factor`, `offset`, `r2`, `rms`, `n`.
- The pass or fail decision quotes `fit_r2_min`.

---

## Phase 3: DBC Ranges and Emit

### Entry Criteria
- Fits done.

### Actions
1. Raw range from `typed_fields`: unsigned `0` to `2^n - 1`; two's complement `-2^(n-1)` to `2^(n-1) - 1`.
2. DBC min and max = factor * raw range + offset (swap if factor is negative).
3. Emit `scaled_signals`, including failing fits marked as fail with their numbers; do not delete them.

### Output
`scaled_signals`.

### Quality Gate
- Every field has min and max computed from the raw range and the chosen factor and offset.
- Failing fits remain in the output with status fail.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/fit.py work/2C4_moto_3_12_pairs.tsv 3.6 0.036
factor 0.0099987 offset 0.0213 r2 0.999731 rms 0.212 n 296
residual mean by raw quintile: [0.012, -0.008, 0.004, -0.009]
rounded factor 0.01 offset 0.0049 rms 0.2121 accept True
```

`fit_r2_min` = 0.999 (user choice): pass. Factor 0.01 km/h per bit accepted with offset 0.0049; a zero offset was not tested by the script, so the offset stays as fitted. Unsigned 12-bit range: min 0, max 40.95 km/h, which is below the drive's top speed: a sign that the field is longer than 12 bits, consistent with the unresolved boundary flag.

---

## Exit Criteria

DONE when every referenced field has a fitted factor and offset with R squared, RMS, residual pattern, rounded-factor decision and DBC range, each marked pass or fail against `fit_r2_min`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reference resolution unknown | **Adjust**: report `q` as unknown and skip the rounded-factor acceptance; keep the fitted factor. |
| Phase 2 | R squared below `fit_r2_min` | **Return**: revisit bit boundaries, signedness or lag; do not drop pairs to raise R squared. |
| Phase 2 | Residual trend across quintiles | **Return**: check missing high bits via `sigre-bit-boundary-search`. |
| Phase 3 | DBC max below observed physical values | **Return**: field is longer than assumed; resolve the boundary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
