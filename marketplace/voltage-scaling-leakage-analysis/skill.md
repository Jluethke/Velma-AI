# Voltage Scaling Leakage Analysis

Analyze the trade-off between supply voltage scaling for dynamic power reduction and its effects on delay and leakage, then apply multi-threshold techniques to manage standby power.

## Inputs

- `clock-tree-topology`: Clock distribution architecture
- `gate-sizes`: Transistor sizes across the design

## Outputs

- `voltage-power-delay-curves`: Power and delay as functions of VDD for the design
- `leakage-mitigation-plan`: Assignment of high-Vt, standard-Vt, and low-Vt cells across the design with estimated leakage reduction

## Process

1. Dynamic power scales as C * VDD^2 * f. Delay scales approximately as VDD / (VDD - Vt)^alpha where alpha is 1.0-1.5 depending on the velocity saturation regime. Plot both curves to find the minimum energy-delay product.
2. Subthreshold leakage scales exponentially with Vt: I_leak proportional to exp(-Vt / (n * Vt_thermal)). At advanced nodes (below 14nm), leakage can be 30-50% of total power. Gate leakage through thin oxide adds another component that scales with gate area and oxide thickness.
3. Apply multi-threshold CMOS (MTCMOS): use low-Vt cells only on timing-critical paths (typically 10-20% of all cells). Use high-Vt cells on non-critical paths (typically 60-70% of cells). Standard-Vt fills the remainder.
4. For blocks that can be power-gated during standby, insert header (PMOS) or footer (NMOS) sleep transistors between the supply rail and the block's virtual supply. Size the sleep transistor so its on-resistance causes less than 5% IR drop at peak current.
5. Calculate retention state requirements: if state must be preserved during sleep, use retention flip-flops (balloon latch with always-on supply) on critical registers. Each retention cell adds approximately 30-50% area overhead.
6. Estimate total power after MTCMOS assignment: sum dynamic power (now at the optimal VDD) plus leakage (reduced by Vt assignment plus power gating). Compare to the power budget. Iterate gate sizes if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
