# Plasma Application Design

Design the plasma process for the specific application: etching, deposition, spray coating, or flow control.

## Inputs

- `plasma-source-design`: Plasma source type and operating parameters
- `plasma-properties`: Measured or predicted plasma density, temperature, and species
- `application-requirements`: Process specifications (etch rate, film properties, coating thickness, flow effect)

## Outputs

- `process-recipe`: Complete operating recipe with gas flows, pressure, power, and timing
- `performance-prediction`: Predicted process outcome with uncertainty bounds
- `process-control-strategy`: Feedback variables and control approach for process stability

## Process

1. For plasma etching: select etch chemistry (fluorine-based for silicon and silicon oxide, chlorine-based for metals and III-V compounds, oxygen for organics and photoresist). Set operating pressure (lower pressure = more directional etching from ion bombardment, higher pressure = more chemical etching with isotropic profile). Bias the substrate to control ion energy independently of plasma density.
2. For plasma-enhanced CVD: select precursor gases (SiH4 + N2O for SiO2, SiH4 + NH3 for SiNx, TEOS for conformal oxide). The plasma dissociates precursors at lower temperature than thermal CVD (300C vs 800C). Control film stress by adjusting RF frequency (13.56 MHz gives compressive stress from ion bombardment, lower frequency gives tensile). Measure refractive index and stress on test wafers.
3. For plasma spray coating: design the plasma torch (DC arc between cathode and anode, gas flow creates a plasma jet at 10,000 to 15,000K). Powder injection location and carrier gas flow determine particle trajectory and heating. Particle velocity (200 to 600 m/s) and temperature (must exceed melting point) determine coating density and adhesion. Standoff distance, spray pattern, and robot path determine coating uniformity.
4. For plasma actuators (flow control): design a dielectric barrier discharge (DBD) actuator: two electrodes separated by a dielectric, driven by AC at 1 to 20 kHz and 5 to 20 kV. The surface discharge creates a body force that induces a wall jet (1 to 5 m/s). Placement near separation points can delay boundary layer separation. Effective at low Reynolds numbers; limited authority at flight-scale Reynolds numbers without very high power.
5. Design the process control strategy: identify the feedback variables (etch endpoint from OES line intensity change, deposition rate from in-situ ellipsometry, spray particle temperature from two-color pyrometry). Implement closed-loop control: adjust power, pressure, or gas flow to maintain the process at its target operating point despite drift in source conditions.
6. Perform design of experiments: plasma processes have many interacting parameters. Use a fractional factorial or response surface methodology to map the parameter space efficiently. Identify the key parameters (typically power and pressure dominate) and their interactions. Build a process window that defines the acceptable range for each parameter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
