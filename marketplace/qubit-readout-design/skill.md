# Qubit Readout Design

Design the dispersive readout system including the readout resonator, Purcell filter, and measurement chain for high-fidelity state discrimination.

## Inputs

- `qubit-type-and-parameters`: Qubit frequency, anharmonicity, and coupling needs
- `coupling-architecture`: Qubit-resonator coupling design
- `coherence-target`: T1 target sets the Purcell limit

## Outputs

- `readout-resonator-design`: Resonator frequency, coupling Q, and dispersive shift
- `purcell-filter-design`: Filter bandwidth and center frequency to protect T1
- `measurement-chain-spec`: Amplifier chain (TWPA/JPA, HEMT, room-temp) with noise budget

## Process

1. Design the readout resonator. Place the resonator frequency 1-2 GHz above the qubit frequency (detuning Delta >> g to stay in the dispersive regime). The dispersive shift chi = g^2 * alpha / (Delta * (Delta + alpha)) determines how much the resonator frequency shifts depending on qubit state. Target chi/2pi = 0.5-2 MHz for fast, high-fidelity readout.
2. Set the resonator external coupling quality factor Qe. This determines the resonator linewidth kappa = omega_r / Qe. For fast readout (< 1 us), kappa/2pi should be 1-5 MHz. The readout fidelity is limited by the signal-to-noise ratio: SNR = 4 * chi^2 * n_readout * T_meas / kappa where n_readout is the number of photons in the resonator during measurement. Keep n_readout below the critical photon number n_crit = Delta^2 / (4*g^2) to avoid measurement-induced transitions.
3. Design the Purcell filter to prevent qubit energy relaxation through the readout port. Without protection, the Purcell-limited T1 = Qe * (Delta/g)^2 / omega_r, which may be shorter than the target. A bandpass Purcell filter centered at the readout frequency with bandwidth matching kappa blocks qubit photon emission at the qubit frequency while passing the readout signal. Verify that the Purcell-limited T1 exceeds the target by at least 5x.
4. Design the measurement amplification chain. First amplifier: quantum-limited amplifier at base temperature (TWPA: traveling wave parametric amplifier, or JPA: Josephson parametric amplifier). Adds near-minimum noise (0.5 photon at the quantum limit). Second stage: HEMT amplifier at 4K (noise temperature 2-5K). Third: room-temperature amplifier. The system noise temperature is dominated by the first amplifier per the Friis equation.
5. Calculate the expected readout fidelity. State discrimination fidelity depends on the separation of the two pointer states in the IQ plane (proportional to chi * sqrt(n_readout) * T_meas) versus the noise (set by the amplifier chain). Include T1 errors during measurement (qubit may decay from excited to ground during readout). Typical state-of-the-art: 99%+ assignment fidelity in 0.5-1 us measurement time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
