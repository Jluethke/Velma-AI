# Figure Of Merit Comparison

Compare MOSFET candidates using the appropriate figure of merit for the application: Rds(on) * Qg for hard-switching, Rds(on) * Qoss for soft-switching, and Rds(on) * Area for power density.

## Inputs

- `conduction-loss-comparison`: Conduction loss for each candidate
- `switching-loss-comparison`: Switching loss breakdown for each candidate

## Outputs

- `fom-ranking`: Candidates ranked by the relevant figure of merit, with total loss (Pcond + Psw) calculated at the operating point
- `loss-dominant-mode`: Whether the application is conduction-loss-dominant (low fsw, high current) or switching-loss-dominant (high fsw, high voltage), which determines which FOM matters most

## Process

1. Calculate Rds(on) * Qg for each candidate. This is the classic hard-switching FOM. Lower is better. It captures the fundamental trade-off: lower Rds(on) requires a larger die (more Qg), so a better FOM means better silicon technology, not just a bigger chip.
2. For soft-switching applications (resonant converters, ZVS), use Rds(on) * Qoss. The switching loss depends on the output charge (energy stored in Coss) rather than the gate charge. GaN devices excel here because their Qoss is much lower than Si at the same Rds(on).
3. Determine the loss-dominant mode. At low switching frequencies (under 100kHz) with high currents: conduction loss dominates, so select for lowest Rds(on) even if Qg is high. At high switching frequencies (above 300kHz) or high voltage: switching loss dominates, so select for lowest Qg and Qgd even if Rds(on) is slightly higher.
4. Plot total loss vs Rds(on) for each technology. For Si MOSFETs: the Rds(on) * Qg trade-off means there is an optimum die size (too small = high conduction loss, too large = high switching loss). Calculate the optimum: d(Ptotal)/d(Rds(on)) = 0 gives the ideal Rds(on) for minimum total loss at a given fsw.
5. Rank the candidates by total power loss at the actual operating point. The FOM is a screening tool; the actual loss calculation at the specific operating conditions is the final decision criterion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
