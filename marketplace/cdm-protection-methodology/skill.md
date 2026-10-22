# Cdm Protection Methodology

Address CDM protection for sensitive internal nodes, particularly thin-oxide gates directly connected to I/O through pass transistors or transmission gates.

## Inputs

- `esd-device-designs`: I/O level ESD protection already designed
- `internal-circuit-topology`: Schematic showing sensitive gates connected near I/O paths

## Outputs

- `cdm-protection-additions`: Additional protection structures for CDM-sensitive nodes
- `cdm-simulation-results`: Voltage at sensitive gates during CDM event

## Process

1. CDM is fundamentally different from HBM: the energy is stored on the IC package capacitance (1-20 pF), and the discharge is extremely fast (sub-nanosecond rise time, total duration 1-3 ns). Peak currents reach 5-15 A but for very short duration.
2. The fast rise time means wire inductance matters. A 1 nH bond wire carries 15 A gives V = L*di/dt = 1e-9 * 15 / 0.5e-9 = 30 V. This voltage appears across the internal circuit before the I/O ESD clamp has time to turn on. Even if the clamp triggers, the inductance holds voltage at the internal node.
3. Identify CDM-vulnerable nodes: any thin-oxide gate that connects to a pad through a low-impedance path (MOS switch, transmission gate, ESD diode). The gate oxide of a 5nm-thick gate fails at approximately 5-6V, well below the CDM-induced voltage.
4. Add local clamp diodes at each vulnerable gate node. These small diodes (50-100 um wide) clamp the local voltage before it reaches oxide breakdown. Place them physically close to the protected gate (within 20 um) to minimize wire inductance between the clamp and the gate.
5. For capacitive DAC inputs in ADCs: the CDM current flows through the sampling switch directly to the capacitor array. Add reverse-biased protection diodes at the switch output that turn on before the oxide reaches breakdown. Size to carry the CDM peak current for the sub-nanosecond pulse.
6. Simulate CDM using a VFTLP (Very Fast TLP) model: 1 ns pulse with 100 ps rise time. Include package parasitics (bond wire inductance, pad capacitance). Measure the voltage at each sensitive gate. All gates must stay below 80% of oxide breakdown voltage during the CDM event.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
