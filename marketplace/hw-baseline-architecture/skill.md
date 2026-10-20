# Hardware Baseline Architecture

**One-line description:** Assembles the conventional design for a board spec from cited vendor reference designs and app notes, then computes its efficiency, dissipation, part count, cost, area, and layer count so every alternative has a measured baseline to beat.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_spec` (object, required): From `hw-spec-consolidate`.
- `critical_circuits` (object[], required): From `hw-critical-circuit-flagging`.

---

## Outputs

- `baseline_architecture` (object): Block diagram as a list of functional blocks, each with the topology used, the reference design or app note it follows (cited), and the representative parts named in that reference.
- `baseline_metrics` (object): Conversion efficiency per rail and overall at typical and worst-case load, total dissipation, part count, BOM cost at quantity 10 and 1000, estimated board area, layer count, each with the data source.

---

## Phase 1: Assemble the Conventional Design

### Entry Criteria
- `board_spec` and `critical_circuits` present.

### Actions
1. For each function in `board_spec` (input protection, each rail, each interface, each critical circuit), find the semiconductor vendor's published reference design or application note for that function and environment. Cite title, document number, and URL.
2. Take the topology and the parts that reference names. Do not improve anything here; the baseline is what a competent engineer builds by following vendor guidance.
3. Assemble the blocks into `baseline_architecture`.

### Output
`baseline_architecture`.

### Quality Gate
- Every block cites a vendor reference design or app note.
- Every function in `board_spec` and every entry in `critical_circuits` maps to a block.

---

## Phase 2: Compute Baseline Metrics

### Entry Criteria
- `baseline_architecture` exists.

### Actions
1. Efficiency: for each regulator, read the datasheet efficiency curve at the rail's typical and worst-case current and the nominal and maximum input voltage. For linear regulators compute Vout / Vin. Overall efficiency = total output power / total input power, including quiescent currents.
2. Dissipation: sum regulator losses, protection device losses at full load (diode forward drop times current, MOSFET RDS(on) times current squared), and quiescent losses.
3. Part count: count every placed component including passives the reference requires.
4. Cost: price every part at quantity 10 and 1000 from a distributor or the fab parts library; record the source and date.
5. Area: sum courtyard areas of all footprints as the lower bound. Derive the routing factor from the cited reference designs themselves: each reference board's published outline area divided by its own courtyard sum, recorded per reference, mean used. If no reference publishes its board dimensions, report the courtyard sum only and list the routed area as an open question. Add connector edge length constraints. Every candidate is estimated with the same factor so comparisons stay consistent.
6. Layer count: carry from `board_spec` unless the reference requires more.

### Output
`baseline_metrics`.

### Quality Gate
- Every efficiency value cites the curve and operating point read.
- Cost cites source and date for every line.
- Metrics cover all six objectives.

---

## Exit Criteria

DONE when the conventional design is fully cited and all six baseline metrics are computed from datasheet and distributor data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No vendor reference exists for a function | **Adjust**: use the most common topology from datasheet typical application circuits; cite the datasheet. |
| Phase 2 | Efficiency curve missing at the operating point | **Adjust**: interpolate between plotted points and mark the value interpolated. |
| Phase 2 | Part price unavailable | **Adjust**: use the closest equivalent's price, mark it as a proxy. |

---

## Reference Section

### Why a Baseline
An alternative is only better when a number says so. The baseline is the denominator for every improvement claim downstream.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
