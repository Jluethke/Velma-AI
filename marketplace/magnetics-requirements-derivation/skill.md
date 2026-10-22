# Magnetics Requirements Derivation

Derive the magnetic component requirements from the converter operating point: inductance, peak current, RMS current, AC flux swing, and operating frequency.

## Inputs

- `converter-operating-point`: Topology, switching frequency, duty cycle range, input/output voltages
- `inductance-and-current`: Required inductance value, peak current, RMS current, and AC ripple current at worst-case operating point

## Outputs

- `flux-swing`: AC flux density swing delta-B in Tesla, calculated from volt-seconds: delta-B = V*D / (N*Ae*fsw)
- `energy-storage`: 0.5*L*Ipk^2 in Joules for inductors, or VA rating for transformers, which drives core size selection

## Process

1. For inductors: calculate energy storage E = 0.5 * L * Ipk^2. This single number determines the minimum core size through the area product. Calculate AC ripple current as a fraction of DC bias: typically 20-40% of Idc for optimal size vs loss trade-off.
2. For transformers: calculate the VA rating = Vrms_pri * Irms_pri. For flyback, the transformer is really a coupled inductor storing energy, so use E = 0.5 * Lm * Ipk^2. For forward/half-bridge/full-bridge, the transformer transfers power without storing energy (except leakage).
3. Calculate the volt-second product: V*t = Vin * D / fsw for the primary. This determines the minimum turns * area product: N * Ae = V*t / (2 * delta_B_max). The allowable delta_B depends on core loss limits.
4. Set initial delta_B target: for ferrite at 100kHz, start with 100-150mT peak (200-300mT swing). For ferrite at 500kHz, reduce to 50-75mT peak. Higher flux means smaller core but higher core loss (roughly proportional to B^2.5 at fixed frequency).
5. Document all requirements in a table: L or Lm, Ipk, Irms, Iac_rms, fsw, V*t, target delta_B, operating temperature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
