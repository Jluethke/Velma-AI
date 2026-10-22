# Wide Bandgap Evaluation

Evaluate whether GaN or SiC devices offer meaningful advantages over silicon for the application, considering performance, cost, gate drive complexity, and reliability maturity.

## Inputs

- `fom-ranking`: Silicon MOSFET candidates ranked by FOM and total loss
- `loss-dominant-mode`: Whether conduction or switching loss dominates

## Outputs

- `wbg-assessment`: Quantified comparison: GaN vs SiC vs Si at the operating point, including total loss, required heat sink size, and achievable switching frequency for each technology
- `technology-recommendation`: Recommended semiconductor technology with cost-performance trade-off analysis: $/Watt saved, break-even volume, and supply chain availability

## Process

1. GaN HEMT evaluation. GaN devices (e-mode, 650V class) have: zero reverse recovery (no body diode), very low Qg and Qgd (5-10x lower than Si), low Rds(on) * Qg FOM. Best for: applications above 200kHz where switching loss dominates, half-bridge topologies where reverse recovery is significant, and designs targeting high power density.
2. GaN challenges: gate voltage is limited to 6V (vs 20V for Si), requiring precise gate drive. No avalanche rating (unlike Si which can absorb transient overvoltage). Threshold voltage is low (1.2-1.7V), making Miller turn-on prevention critical. Packages are often QFN with exposed die-attach pad, requiring specific soldering profiles.
3. SiC MOSFET evaluation. SiC (1200V class and above) offers: very low Rds(on) at high voltage (10x better than Si at 1200V), high temperature operation (175C junction), fast body diode with low Qrr, high avalanche ruggedness. Best for: 600V+ applications (PFC, solar inverter, EV charger, motor drives), high-temperature environments.
4. SiC challenges: gate oxide reliability requires -5V to +18V gate drive (not 0 to 12V like Si). Higher cost per amp than Si (3-5x at equivalent current rating). Threshold voltage instability under bias-temperature stress. Requires negative turn-off voltage to prevent parasitic turn-on from dv/dt.
5. Cost-performance trade-off. Calculate the efficiency difference: delta_eta = (Ploss_Si - Ploss_WBG) / Pout. Calculate the annual energy savings at a given duty cycle and electricity cost. Calculate the heat sink size reduction. If the WBG device eliminates a heat sink ($5-20) or allows removing a fan ($3-10), include that system-level cost reduction. Break-even: if the WBG device costs $3 more but saves $5 in heat sink and fan, it is immediately cost-effective.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
