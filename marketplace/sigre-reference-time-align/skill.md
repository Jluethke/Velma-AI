# Align Candidate Signals with a Reference in Time

**One-line description:** Pairs each numeric field's raw series with a reference series (GPS, passive OBD-II or manual cluster readings) by searching the time lag that maximizes Pearson correlation, then writes lag-corrected (raw, reference) pairs for regression.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `typed_fields` (object[], required): Output of `sigre-endianness-signedness-test`, with raw series files.
- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`; `segments.tsv` gives the drive and action windows.
- `gps_reference` (object, optional): Output of `sigre-gps-speed-reference-log`.
- `obd2_reference` (object, optional): Output of `sigre-obd2-passive-pid-reference`.
- `manual_reference` (object, optional): A user file `manual_ref.tsv` with `epoch<TAB>value<TAB>unit`, read from a video of the instrument cluster whose clock was synchronized to the capture host (for example a phone filming the laptop clock and the cluster in one frame).

---

## Outputs

- `aligned_pairs` (object[]): Per field and reference: the pairs file `work/pairs_<id>_<ref>.tsv` (`ref_epoch<TAB>raw<TAB>ref_value`), the chosen lag in seconds, the correlation at that lag, the lag search range and step, and the number of pairs.

---

## Phase 1: Match Fields to References

### Entry Criteria
- At least one of `gps_reference`, `obd2_reference`, `manual_reference` is present.

### Actions
1. Map each numeric field to the reference that measures the same quantity, by the action that revealed it:

| Field found by action | Reference |
|---|---|
| Driving speed segment | GPS `speed_mps`, or OBD PID 0x0D |
| Engine speed rising with throttle at idle | OBD PID 0x0C, or manual tachometer readings |
| Coolant warming over a drive | OBD PID 0x05 |
| No matching reference | none: the field stays unscaled; carry it forward with type and raw range only |

2. Do not pair a field with a reference of a different quantity just because the correlation is high (engine speed and vehicle speed correlate in a fixed gear).

### Output
Field-to-reference map.

### Quality Gate
- Every numeric field has a reference or an explicit "none".
- Every pair names the action that links the field to that quantity.

---

## Phase 2: Lag Search

### Entry Criteria
- Map exists.

### Actions
1. Set the lag search range to plus or minus the length of the shortest action window in `segments.tsv` for that capture, and the step to the field's median frame period. Record both.
2. Save as `~/canre/align.py` and run `python ~/canre/align.py work/2C4_moto_3_12.tsv gps_ref.tsv RANGE STEP`:
   ```
   import sys, numpy as np
   raw = np.loadtxt(sys.argv[1]); ref = np.loadtxt(sys.argv[2], usecols=(0, 1))
   R, S = float(sys.argv[3]), float(sys.argv[4])
   tr, xr = raw[:, 0], raw[:, 1]
   keep = (ref[:, 0] > tr[0] + R) & (ref[:, 0] < tr[-1] - R)
   tf, yf = ref[keep, 0], ref[keep, 1]
   best = None
   for lag in np.arange(-R, R + S / 2, S):
       x = np.interp(tf + lag, tr, xr)
       r = np.corrcoef(x, yf)[0, 1]
       if best is None or abs(r) > abs(best[1]): best = (lag, r)
   print("lag_s %.4f r %.5f n %d" % (best[0], best[1], len(tf)))
   np.savetxt(sys.argv[1].replace(".tsv", "_pairs.tsv"), np.c_[tf, np.interp(tf + best[0], tr, xr), yf], fmt="%.6f\t%.3f\t%.4f")
   ```
   Positive lag means the CAN signal comes later than the reference timestamp. The reference file must hold two numeric columns (epoch, value). For OBD, split per PID first: `awk -F'\t' '$2=="0x0D"{print $1"\t"$3}' obd2_ref.tsv > obd_0D.tsv`. For GPS, `gps_ref.tsv` already has epoch and speed as its first two columns.
3. Use the column holding the chosen signedness reading (column 1 unsigned, column 2 twos) by editing `usecols` or `raw[:, 1]` accordingly.
4. Remove pairs inside log gaps: if the raw series has a gap longer than its normal period around a reference time, drop that pair; interpolation across a gap invents values.

### Output
Lag, correlation and pairs file per field.

### Quality Gate
- The printed `lag_s` is not at either end of the search range (a lag at the edge means the true lag is outside it).
- The pairs file exists and its row count equals the printed `n` minus dropped gap pairs (recorded).

---

## Phase 3: Emit

### Entry Criteria
- Lags found.

### Actions
1. Record per pair: lag, r, n, range, step and the reference's resolution (from its source flow).
2. A negative r means the field decreases as the reference rises: keep it; the regression will return a negative factor, and the field may be inverted or a different quantity, which the confidence report notes.
3. Emit `aligned_pairs`.

### Output
`aligned_pairs`.

### Quality Gate
- Every row of `aligned_pairs` references an existing pairs file.
- Every row records r and lag to the printed precision.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/align.py work/2C4_moto_3_12.tsv gps_ref.tsv 2.0 0.02
lag_s 0.3400 r 0.99871 n 296
```

Lag 0.34 s inside the range (GPS receiver latency plus host receive delay), r 0.9987, 296 pairs, none dropped for gaps.

---

## Exit Criteria

DONE when every numeric field with a matching reference has a lag inside the search range, a correlation, and a gap-free pairs file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No reference provided at all | **Return**: fields stay unscaled; continue to the DBC with raw units noted. |
| Phase 2 | Best lag at the range edge | **Adjust**: widen the range to the next action window length and rerun. |
| Phase 2 | Correlation weak at every lag | **Return**: wrong field-reference pairing or wrong bit set; revisit `sigre-bit-boundary-search`. |
| Phase 2 | Manual reference clock not synchronized | **Stop**: manual readings without a host-clock sync cannot be aligned. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
