# Symmetrical Components Fault Analysis

Calculate fault currents using symmetrical components: positive, negative, and zero sequence networks for three-phase, line-to-line, line-to-ground, and double-line-to-ground faults.

## Inputs

- `system-one-line-diagram`: Network topology with equipment ratings, impedances, and transformer connections
- `equipment-data`: Generator subtransient reactances, transformer impedances, cable and line impedances, and source short circuit capacity

## Outputs

- `fault-current-results`: Three-phase, SLG, LL, and DLG fault currents at each bus, with symmetrical and asymmetrical (DC offset) values
- `sequence-impedance-model`: Positive, negative, and zero sequence impedance matrices for the network

## Process

1. Build the sequence networks. The positive sequence network is the normal power flow network with all sources and impedances. The negative sequence network has the same topology but generators are represented by their negative sequence reactance (approximately equal to subtransient reactance for round-rotor machines). The zero sequence network depends on transformer winding connections: delta windings block zero sequence current; wye-grounded windings pass it.
2. Calculate the three-phase fault current. This uses only the positive sequence network: I_fault_3ph = V_prefault / Z1_total, where Z1_total is the positive sequence impedance from the source to the fault point. This is the simplest and often the highest-magnitude fault.
3. Calculate the single-line-to-ground (SLG) fault current. Connect the three sequence networks in series at the fault point: I_fault_SLG = 3 x V_prefault / (Z1 + Z2 + Z0 + 3Zf), where Zf is the fault impedance. In solidly-grounded systems, the SLG fault current can exceed the three-phase fault current when Z0 is less than Z1.
4. Apply the DC offset for asymmetrical fault current. The first half-cycle peak is the RMS symmetrical current times the asymmetry factor: I_peak = I_rms_sym x sqrt(2) x (1 + e^(-t/(X/R x T))), where X/R is the system X/R ratio at the fault point and T is the half-cycle period. The momentary (first cycle) and interrupting (3-5 cycle) duty factors from IEEE C37 standards convert symmetrical RMS to the values used for equipment rating verification.
5. Verify equipment ratings. Compare the calculated fault currents against the interrupting rating of circuit breakers, the withstand rating of buses and cables, and the through-fault capability of transformers. If the available fault current exceeds the equipment rating, either upgrade the equipment or install current-limiting devices (fuses, current-limiting reactors, or is-limiters).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
