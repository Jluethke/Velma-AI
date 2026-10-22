# Winding Design And Loss Analysis

Design the winding structure, calculate turns count, select wire gauge accounting for skin and proximity effects using Dowell's method, and estimate total winding loss.

## Inputs

- `selected-core`: Core geometry with Ae, Aw, window dimensions
- `core-loss-density`: Core loss at operating point for thermal budget allocation

## Outputs

- `winding-specification`: Number of turns per winding, wire type (solid, Litz, foil), wire gauge, layer count, winding order for transformers
- `winding-loss`: Total copper loss broken down into DC resistance loss and AC proximity/skin effect loss, with Rac/Rdc ratio

## Process

1. Calculate turns: N = L * Ipk / (Bmax * Ae) for inductors. For transformers: Npri = Vin * D / (fsw * delta_B * Ae), Nsec = Npri / turns_ratio. Round to nearest integer and verify flux density stays within limits.
2. Calculate skin depth: delta = 66.2 / sqrt(f_kHz) mm for copper at 25C. At 100kHz, delta = 0.21mm, so wire diameter should not exceed 2*delta = 0.42mm for full utilization. Use Litz wire (multiple individually insulated strands each below skin depth) for frequencies above 50kHz.
3. Apply Dowell's method for proximity effect. Calculate the number of layers p = N * d_wire / (h_window * Kw). The AC resistance factor: Fr = Rac/Rdc = G1(Q) + (2*(p^2 - 1)/3) * G2(Q) where Q = d_strand * sqrt(pi*f*mu0/(4*rho)) is the ratio of strand diameter to skin depth. G1 and G2 are hyperbolic functions. For p > 2 layers, proximity effect can increase AC loss 5-20x.
4. For transformers, interleave windings to reduce effective layer count. Full interleave (P-S-P-S) reduces p to 1 for each section, cutting proximity loss dramatically compared to non-interleaved (P-P-S-S). The trade-off is increased interwinding capacitance.
5. Calculate total winding loss: Pcu = Irms_dc^2 * Rdc + Irms_ac^2 * Rac. For inductors, Irms_dc is the DC bias current and Irms_ac is the ripple current. The AC component flows through Rac which includes skin and proximity. Litz wire: calculate Rac using individual strand diameter in Dowell's equation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
