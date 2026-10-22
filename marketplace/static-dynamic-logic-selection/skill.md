# Static Dynamic Logic Selection

Evaluate whether static CMOS, domino, or other dynamic logic styles are appropriate for each critical path segment based on speed, noise margin, and testability requirements.

## Inputs

- `gate-sizes`: Sized gate list from logical effort analysis
- `estimated-path-delay`: Path delay from static CMOS sizing

## Outputs

- `logic-style-assignments`: Each path segment tagged as static CMOS, foot-gated domino, or TSPC, with rationale
- `revised-delay-estimate`: Updated delay estimate after logic style changes

## Process

1. Static CMOS is the default. It has full rail-to-rail swing, good noise margins (approximately 40% of VDD), is ratioless, and needs no clock distribution to logic blocks. Use it unless delay is unachievable.
2. If static CMOS cannot meet the delay budget, evaluate domino logic for the critical stages. Domino eliminates the PMOS pull-up stack, reducing input capacitance by roughly 2x for the same drive strength. The delay improvement is typically 1.5-2x per stage.
3. Domino constraints: outputs are monotonic (can only transition once per cycle), so every other stage must be an inverter (creating NAND-INV-NAND domino chains). Wide OR functions (e.g., 8-input OR) are ideal candidates.
4. Check noise margin: domino gates have reduced noise margin during evaluation (approximately VTn above ground). Compute the charge-sharing ratio: if the internal node capacitance exceeds 10-15% of the output node capacitance, add keeper transistors or secondary precharge transistors.
5. For very high speed paths in clock-edge-critical circuits, evaluate true single-phase clock (TSPC) logic, which eliminates the need for complementary clocks. TSPC trades area for clock simplicity.
6. Assign each segment its logic style. Verify that domino-to-static interfaces have proper level conversion (typically a simple inverter). Update the delay estimate using style-specific delay models.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
