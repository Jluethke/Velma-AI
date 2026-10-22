# Qubit Parameter Design

Select qubit type and calculate the Josephson junction parameters, capacitance, and frequency to meet coherence and gate fidelity targets.

## Inputs

- `coherence-target`: Target T1 and T2 relaxation times in microseconds
- `gate-fidelity-target`: Target single-qubit and two-qubit gate error rates
- `processor-architecture`: Number of qubits, connectivity, and frequency allocation plan

## Outputs

- `qubit-type-and-parameters`: Transmon or fluxonium parameters: Ej, Ec, frequency, anharmonicity
- `junction-specification`: Junction area, critical current density, and target resistance
- `coupling-architecture`: Qubit-qubit and qubit-resonator coupling design

## Process

1. Select qubit type. Transmon (Ej/Ec >> 1, typically 50-100): exponentially suppressed charge noise sensitivity at the cost of reduced anharmonicity (200-350 MHz). Standard choice for current processors. Fluxonium (Ej/Ec ~ 1-10, large superinductance): higher anharmonicity and potentially longer T1 at the cost of more complex fabrication and flux-bias requirement.
2. For a transmon, set the target frequency (typically 4-6 GHz, spread across the processor to avoid frequency collisions). The qubit frequency is approximately f_01 = (sqrt(8*Ej*Ec) - Ec) / h. Anharmonicity alpha = -Ec. Choose Ec = 200-350 MHz (sets the anharmonicity). Then Ej = (f_01 + Ec)^2 / (8*Ec). For a 5GHz transmon with Ec = 300MHz: Ej = (5.3GHz)^2 / (8*0.3GHz) = 11.7 GHz.
3. Calculate the Josephson junction critical current: Ic = 2*pi*Ej / Phi_0 where Phi_0 = h/(2e) is the flux quantum. For Ej = 11.7 GHz: Ic = 24 nA. The junction room-temperature resistance Rn = pi*Delta/(2*e*Ic) where Delta is the superconducting gap of aluminum (180 ueV). This gives Rn = 11.8 kOhm. Junction area = Rn * Jc_product where Jc is the critical current density of the fabrication process (typically 0.5-2 uA/um^2 for Al/AlOx/Al).
4. Design the coupling architecture. Fixed capacitive coupling between transmons gives a coupling strength g/2pi of 1-30 MHz depending on the capacitor geometry. For tunable coupling, add a coupler qubit between computational qubits (allows coupling to be turned on for gates and off for idle, suppressing residual ZZ interaction). Qubit-readout resonator coupling: target dispersive shift chi/2pi = 0.5-2 MHz for state discrimination with readout time of 0.5-2 us.
5. Perform frequency collision analysis. Map all qubit frequencies, readout frequencies, and their harmonics. Avoid: qubit-qubit frequency collisions (need > 30 MHz separation for fixed-frequency transmons), qubit frequency near readout frequency, straddling condition where two-qubit frequency sum equals twice a third qubit frequency. Use frequency allocation algorithms for large processors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
