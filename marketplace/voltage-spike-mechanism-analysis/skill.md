# Voltage Spike Mechanism Analysis

Identify the source and magnitude of voltage spikes in the switching circuit by analyzing parasitic inductances in the power loop and the energy stored in them at turn-off.

## Inputs

- `power-circuit-schematic`: Converter schematic showing all switches, diodes, magnetics, and the physical PCB layout or wiring that determines parasitic inductance
- `switching-waveforms`: Measured or estimated drain-source voltage and current waveforms showing the spike magnitude and ringing frequency

## Outputs

- `parasitic-inductance-map`: Identified parasitic inductances: transformer leakage inductance, PCB trace/plane inductance in the commutation loop, lead inductance of components, and their numerical values
- `spike-energy`: Energy stored in each parasitic inductance at the moment of turn-off: E = 0.5 * Lpar * Ipk^2, which must be absorbed by the snubber or clamp

## Process

1. Identify the commutation loop: the path through which current transfers from the turning-off device to the freewheeling path. For a buck converter, this is: MOSFET drain -> input capacitor -> MOSFET source -> freewheeling diode -> inductor. Every inductance in this loop contributes to the voltage spike.
2. Estimate parasitic inductances. PCB trace: approximately 1nH/mm for a trace over a ground plane, 5-10nH/mm for a trace without a nearby return path. Leaded components: 5-10nH per lead. SMD components: 0.5-2nH. Transformer leakage inductance: typically 1-5% of magnetizing inductance, measured with the secondary shorted.
3. Calculate the voltage spike. At turn-off, the current through the parasitic inductance cannot change instantly. The spike voltage: Vspike = Lpar * di/dt where di/dt is the turn-off speed of the switch. With Lpar = 20nH and di/dt = 1A/ns (100A in 100ns): Vspike = 20V above the bus voltage.
4. For flyback converters, the leakage inductance energy is the primary spike source. At turn-off, the primary current switches from the MOSFET to the transformer. The magnetizing inductance energy transfers to the secondary, but the leakage inductance energy has no path (secondary does not couple to it) and appears as a spike on the drain: Vspike = Vin + n*Vout + sqrt(Lleak/Coss) * Ipk.
5. Calculate the total spike energy per cycle: Espike = 0.5 * Lleak * Ipk^2. At 100kHz, the power that must be handled: Pspike = Espike * fsw. This determines the snubber/clamp dissipation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
