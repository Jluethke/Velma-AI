# Signal Integrity Rule Verification

Verify signal integrity rules: impedance, length matching, crosstalk, and stub lengths across all controlled nets.

## Inputs

- `net-class-definitions`: Constraint definitions with SI rules
- `rule-hierarchy`: Priority order for conflicting rules
- `constraint-manager-setup`: EDA tool configuration

## Outputs

- `impedance-verification-report`: Every controlled-impedance net: target, achieved (from field solver), and pass/fail
- `length-matching-report`: Every matched-length group: target tolerance, achieved mismatch, and pass/fail
- `crosstalk-report`: Near-end and far-end crosstalk between adjacent controlled nets, compared to budget
- `stub-length-report`: Via stub lengths for all high-speed nets, compared to the lambda/10 limit at the signal's bandwidth

## Process

1. Run impedance extraction on all controlled-impedance nets using the routed geometry and the fabricator-confirmed stackup. Compare extracted impedance to target. Flag any net where the impedance is outside the tolerance. Common causes: trace necked down near BGA pads (need to maintain width through the escape), reference plane void under the trace (need to check plane continuity).
2. Run length matching report for all matched groups: DDR byte lanes (each lane's data bits matched to its strobe, then all strobes matched to the clock), differential pairs (intra-pair matching), and bus groups (all bits of a parallel bus). Flag any group outside tolerance. Fix with serpentine length tuning.
3. Run crosstalk analysis on adjacent high-speed traces: extract near-end and far-end crosstalk from the 2D field solver at the actual routed spacing. Compare to the noise budget allocation for crosstalk. If crosstalk exceeds the budget, increase spacing between the victim and aggressor, or add a ground trace between them (a ground trace at the same layer, connected to the reference plane with vias, provides about 20 dB of additional isolation).
4. Calculate via stub lengths: for through-hole vias used by signals on inner layers, the unused portion of the via barrel is a stub that creates a resonance at f_res = c / (4 * L_stub * sqrt(Dk)). If this resonance frequency falls within the signal bandwidth, it causes insertion loss. The stub must be shorter than lambda/10 at the signal's bandwidth. If too long, use back-drilling to remove the stub (fabricator process) or use blind vias to avoid the stub entirely.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
