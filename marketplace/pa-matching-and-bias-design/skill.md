# Pa Matching And Bias Design

Design the input and output matching networks to present the optimal impedances, and the bias network for thermal stability and video bandwidth.

## Inputs

- `optimal-impedances`: Source and load impedances for the transistor
- `load-pull-contours`: Sensitivity of performance to impedance variation
- `pa-requirements`: Bandwidth, frequency, and bias point

## Outputs

- `pa-matching-networks`: Input and output matching network schematics with element values or transmission line dimensions
- `pa-bias-circuit`: Bias network design including bias tee, decoupling, thermal tracking, and sequencing

## Process

1. Design the output matching network to transform 50 ohms to the optimal load impedance at the transistor drain/collector. Use the impedance matching methodology: select topology based on bandwidth (narrowband: L-network or stub match; broadband: multi-section transformer or Klopfenstein taper).
2. The output matching network must also provide the correct harmonic terminations if harmonic tuning is used. This requires additional resonant elements or stubs tuned to 2f0 and 3f0.
3. Design the input matching network for the optimal source impedance (from source-pull data or conjugate of large-signal S11). The input match primarily affects gain flatness and stability. Check stability at all frequencies with the input match in place.
4. Design the bias network: the DC bias must reach the transistor without interfering with the RF signal. Use a quarter-wave stub (at the operating frequency) as an RF choke, presenting high impedance at RF while passing DC. Add bypass capacitors at the end of the stub for wideband grounding.
5. For GaN HEMTs: gate bias must be applied before drain bias (negative Vgs first, then positive Vds) to prevent excessive current during turn-on. Design a sequencing circuit or use the PA controller IC's sequencing feature.
6. Thermal stability: the transistor's gain and bias point change with temperature. For GaN and LDMOS, use a temperature-compensating bias circuit (thermistor in the bias divider) to maintain the quiescent current as junction temperature varies. This prevents thermal runaway in class AB.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
