# PCB Layout Metrics

**One-line description:** Measures the finished board directly from its file (via count, trace length, hot-loop areas, power path resistance and its I2R loss, area, layers) and compares each metric against the placement prediction and the conventional baseline, so any improvement is a measured delta.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kicad_pcb` (string, required): DRC-clean board.
- `placement_scorecard` (object[], required): Predicted metrics from placement scoring.
- `baseline_metrics` (object, required): Metrics of the conventional reference design from `hw-baseline-architecture`.

---

## Outputs

- `layout_scorecard` (object): Each measured metric with unit, the placement prediction, the baseline value, and the delta against each.

---

## Phase 1: Measure the Board

### Entry Criteria
- `kicad_pcb` passes DRC.

### Actions
1. With the `pcbnew` Python module, measure: total via count; total routed trace length; hot-loop area per switching regulator in mm^2; board area; layer count.
2. For each power path from regulator output to load, compute resistance from trace geometry: R = rho x L / (W x T), rho = 1.72e-8 ohm m for copper at 20 C, corrected for temperature by 0.393% per C, T from copper weight (1 oz = 35 um). Polygons: approximate by their narrowest width along the path.
3. Compute I2R loss per path at worst-case current from the power tree; sum to total distribution loss in watts.

### Output
Measured metrics.

### Quality Gate
- Every metric has a value and unit; every resistance computation records L, W, T, and temperature.

---

## Phase 2: Compare

### Entry Criteria
- Measurements complete.

### Actions
1. For each metric, compute delta against the placement prediction and against `baseline_metrics` where the baseline has that metric.
2. Flag any metric worse than baseline and name the likely cause from the layout.
3. State plainly when a delta is zero or negative; only positive measured deltas count as improvements.

### Output
`layout_scorecard`.

### Quality Gate
- Every comparable metric has both deltas.
- No improvement is claimed without a positive measured delta.

---

## Exit Criteria

DONE when the board's measured metrics and their deltas against prediction and baseline are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Path resistance ambiguous through pours | **Adjust**: use the narrowest neck as width and mark the value as an upper bound. |
| Phase 2 | Baseline lacks a metric | **Adjust**: record the board value with "no baseline" instead of a delta. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
