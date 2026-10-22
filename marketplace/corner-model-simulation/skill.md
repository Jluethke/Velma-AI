# Corner Model Simulation

Set up and run process corner simulations to verify that the circuit meets specifications across the full global PVT (process, voltage, temperature) space.

## Inputs

- `variation-catalog`: Process variation sources and magnitudes
- `circuit-schematic`: Sized circuit to simulate

## Outputs

- `corner-simulation-results`: Performance at each PVT corner with pass/fail against specifications
- `worst-case-corners`: The specific corners that limit each performance parameter

## Process

1. Standard corners: TT (typical-typical), SS (slow NMOS, slow PMOS), FF (fast-fast), SF (slow NMOS, fast PMOS), FS (fast NMOS, slow PMOS). SS and FF capture the global shift extremes. SF and FS capture the skew between NMOS and PMOS.
2. Voltage corners: VDD +/- 10% (or as specified). Low VDD degrades speed and headroom. High VDD increases power and may cause reliability issues (hot carrier degradation, oxide stress).
3. Temperature corners: typically -40C to 125C (or junction temperature up to 150C). Cold temperature increases Vt (slower digital, better subthreshold leakage) but improves mobility (faster analog transconductance). Hot temperature decreases Vt, increases leakage, and degrades mobility.
4. Cross all corners: the full matrix is 5 process * 3 voltage * 3 temperature = 45 combinations. Not all are physically meaningful (SS at hot is typically worst for speed; FF at cold may be worst for hold timing). Run the full matrix for signoff, but focus debug effort on the known worst cases.
5. For each performance parameter, identify the worst-case corner. Speed: SS, low VDD, hot. Power: FF, high VDD, hot. Setup timing: SS, low VDD, hot. Hold timing: FF, high VDD, cold. Offset: SF or FS (skew-limited). Noise: SS, low VDD (lower gm).
6. If any corner fails specification, determine the root cause (which variation source) and redesign: increase headroom margin (larger Vdsat), add tracking bias circuits (bandgap-referenced), or widen transistors to reduce sensitivity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
