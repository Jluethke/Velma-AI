# Component Stress Analysis

Calculate voltage and current stress on switches, diodes, inductors, and capacitors for each candidate topology to identify the one with lowest total component cost and loss.

## Inputs

- `duty-cycle-range`: Duty cycle range from requirements capture
- `topology-candidates`: List of viable topologies to analyze

## Outputs

- `switch-stress-table`: For each topology: peak voltage across switch (Vin for buck, Vout for boost, Vin+Vout*N for flyback), peak and RMS current through switch
- `passive-stress-table`: For each topology: inductor peak current and energy storage, output capacitor RMS ripple current, input capacitor RMS current

## Process

1. For each candidate topology, calculate switch voltage stress. Buck: Vds_max = Vin_max + spike. Boost: Vds_max = Vout + spike. Flyback: Vds_max = Vin_max + N*Vout + Vleak_spike. Forward: Vds_max = Vin_max * (1 + 1/n_reset). Half-bridge: Vds_max = Vin_max. Full-bridge: Vds_max = Vin_max. Add 20% margin for ringing.
2. Calculate switch RMS current. Buck: Isw_rms = Iout * sqrt(D). Boost: Isw_rms = Iout/(1-D) * sqrt(D). These determine conduction loss. Calculate peak current including ripple: Ipk = Iavg + deltaI/2 where deltaI = (Vin - Vout)*D/(L*fsw) for buck.
3. Calculate output capacitor ripple current. Buck: Icap_rms = deltaIL / (2*sqrt(3)). Boost: Icap_rms = Iout * sqrt(D/(1-D)). High RMS current drives capacitor selection and lifetime. Flyback output cap sees the full rectified secondary current pulse.
4. Calculate inductor energy storage: E = 0.5*L*Ipk^2. This drives inductor size. Compare across topologies: flyback stores all energy in the magnetizing inductance (larger core), forward only stores ripple energy (smaller inductor but needs output choke).
5. Build a comparison table: total semiconductor VA rating, total magnetics energy, total capacitor ripple current. The topology with the lowest aggregate stress at the target operating point is the best candidate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
