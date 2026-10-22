# Charge Pump Design

Design the charge pump for the PLL, addressing current matching, dead zone elimination, charge sharing, and clock feed-through that generate reference spurs.

## Inputs

- `pll-architecture`: PLL architecture with loop bandwidth and reference frequency
- `component-specifications`: Charge pump current and matching requirements

## Outputs

- `charge-pump-schematic`: Sized charge pump circuit with current matching and timing circuits
- `reference-spur-estimate`: Estimated reference spur level from charge pump non-idealities

## Process

1. Set the charge pump current Icp. Higher current allows smaller loop filter components but increases power and spur generation. Typical range is 50 uA to 5 mA. Icp sets the loop gain: Kpd = Icp / (2*pi) in A/rad.
2. Design matched up and down current sources. Current mismatch causes a static phase offset that produces reference spurs. Mismatch of 1% produces spurs approximately 20*log10(Icp_mismatch * Tpfd / (2*pi*Icp)) dBc below the carrier. Use cascode current mirrors and size transistors for matching (large L, common centroid layout).
3. Eliminate the dead zone: if the PFD has a dead zone (where both UP and DOWN are simultaneously off for small phase errors), noise in that region is unsuppressed. Add a minimum on-time by inserting delay in the reset path. This creates a brief period where both current sources are on simultaneously, but the net charge is zero if well matched.
4. Address charge sharing: when current source transistors turn off, charge stored on their drain capacitance is dumped onto the loop filter. Add dummy transistors that absorb this charge, or use a replica-biased topology where the current source drains are always near the loop filter voltage.
5. Estimate reference spurs: Spur_level = 20*log10(Icp_mismatch * T_mismatch * fref / (Icp * Kvco * C_total)). Each non-ideality (current mismatch, timing mismatch, charge sharing, clock feedthrough) adds a spur component. Sum them and compare to the spur specification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
