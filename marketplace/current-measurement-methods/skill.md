# Current Measurement Methods

Select and apply the correct current measurement technique based on the signal characteristics: DC+AC, AC only, peak, bandwidth requirement, and isolation needs.

## Inputs

- `probe-assignment`: Voltage probe assignments for correlated measurements
- `grounding-method`: Grounding approach for each measurement point

## Outputs

- `current-sensor-selection`: Current sensor type for each measurement: shunt + differential amp (highest accuracy), Rogowski coil (AC only, wide bandwidth), current transformer (AC, galvanic isolation), or hall-effect clamp (DC+AC, moderate bandwidth)
- `current-measurement-setup`: Complete measurement setup: sensor placement on the PCB, deskew with voltage channel, and calibration check procedure

## Process

1. Shunt resistor with differential probe: the highest-accuracy method. Place a low-inductance shunt (1-10 milliohm, 4-terminal Kelvin) in the current path. Measure the voltage across it with a differential probe. Current = V_shunt / R_shunt. Accuracy limited by shunt tolerance (0.1-1%), temperature coefficient, and probe accuracy. Bandwidth: limited by the probe (up to 200MHz with an active differential probe).
2. Rogowski coil: AC current only (no DC component). A flexible coil wraps around the conductor. The output voltage is proportional to di/dt, so an integrator is needed (usually built into the probe). Bandwidth: 30MHz+ for good probes. Dynamic range: from milliamps to kiloamps. Non-invasive (does not require breaking the circuit). Best for: measuring switch current during transitions, transformer current, and high di/dt events.
3. Current transformer (CT): AC current, galvanically isolated. A toroidal core with a secondary winding around the conductor. The secondary current = Iprimary / N (turns ratio). Measure the secondary current through a burden resistor. Droop at low frequency: the CT saturates if the current has a DC component or the pulse width exceeds the L/R time constant. Not suitable for continuous DC measurement.
4. Hall-effect current probe (clamp-on): measures DC and AC current. Bandwidth: typically 50-100MHz for split-core probes, up to 120MHz for high-end. Accuracy: 1-3% of reading. Degaussing required before precision measurement (residual magnetization offsets the zero). Best for: measuring average inductor current, load current, and input current where DC component matters.
5. Deskew: when measuring voltage and current simultaneously (for power loss calculation), the time alignment between channels must be verified. Use a deskew fixture or measure a known circuit (resistor with fast current step) and adjust the channel delay until V and I edges align. A 2ns skew at 100MHz causes significant power measurement error.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
