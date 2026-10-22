# Cryogenic Wiring Design

Design the electrical wiring from room temperature to the experiment at base temperature, balancing signal fidelity against heat load.

## Inputs

- `cooling-stage-layout`: Temperature stages and available cooling power
- `signal-requirements`: Number and type of lines (DC bias, microwave control, readout, flux)
- `base-temperature-requirement`: Target base temperature for noise floor

## Outputs

- `wiring-plan`: Cable types, attenuation, and filtering at each stage for each signal line
- `heat-load-from-wiring`: Calculated heat load contribution from all wiring at each stage
- `noise-temperature-budget`: Effective noise temperature at the qubit from the wiring and attenuation plan

## Process

1. Categorize signal lines by type. DC bias lines (flux bias, gate voltage): low bandwidth, need heavy filtering. Microwave drive lines (qubit control at 4-8 GHz): need attenuation to thermalize noise from room temperature but low enough loss to deliver adequate power. Readout output lines: carry weak signals from the qubit, must preserve signal with minimum added noise. Pump lines for parametric amplifiers: moderate power microwave.
2. Design microwave drive line attenuation. Room temperature electronics generate thermal noise at 300K (kT = 6.2e-21 J at 300K, equivalent to about 25 photons at 5 GHz). To thermalize this noise to the base temperature (20 mK, 0.08 photons), attenuate by at least 10*log10(300/0.02) = 42 dB distributed across stages. Typical plan: 20dB at 4K, 10dB at still, 10dB at cold plate, 3dB at mixing chamber. Each attenuator dissipates power at its stage and must be counted in the heat budget.
3. Design DC wiring. Use resistive wire (phosphor bronze, manganin, or NbTi superconducting below 10K) to minimize thermal conduction. Each stage gets a low-pass filter: copper powder filter, Eccosorb filter, or RC filter to block high-frequency noise from reaching the qubits. The wire thermal conductance sets the heat load: Q = integral(k(T) * A/L * dT) from hot to cold side of each segment.
4. Design the readout output chain. From the qubit, the signal goes through a circulator or isolator (prevents amplifier noise from reaching the qubit), into the quantum-limited amplifier (TWPA or JPA at base temperature, dissipating 1-10 uW), then through a HEMT at 4K. The circulator/isolator adds 0.5-1 dB insertion loss. Superconducting NbTi coaxial cable between mixing chamber and 4K minimizes loss on the readout path.
5. Sum the total heat load from wiring. For each cable segment between stages, calculate: P_cond = integral of k(T)*A/L*dT, P_diss = attenuation power dissipated at that stage, P_radiation = any radiative load from imperfect shielding. Verify that the total at each stage is within the cooling power budget. If the heat load is too high, switch to thinner cables, add more thermal intercepts, or reduce the number of lines (multiplexing).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
