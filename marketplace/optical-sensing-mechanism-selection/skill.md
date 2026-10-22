# Optical Sensing Mechanism Selection

Select the optical sensing mechanism from the measurand characteristics, required sensitivity, and deployment environment.

## Inputs

- `measurand-requirements`: Physical quantity to measure (strain, temperature, pressure, chemical, acoustic)
- `sensitivity-resolution-spec`: Required measurement resolution and range
- `deployment-environment`: Temperature range, chemical exposure, electromagnetic interference, access constraints

## Outputs

- `sensing-mechanism`: Selected sensing approach with operating principle and sensitivity formula
- `sensor-element-design`: Physical sensor element specifications (FBG parameters, interferometer type, coating)
- `cross-sensitivity-analysis`: Identification of interfering measurands and discrimination strategy

## Process

1. Map the measurand to available optical mechanisms. Strain/temperature: fiber Bragg grating (FBG) with wavelength shift 1.2 pm/microstrain or 10 pm/degC at 1550nm. High-resolution acoustic/vibration: Fabry-Perot interferometer or phase-sensitive OTDR. Chemical: fluorescence quenching (oxygen), absorption spectroscopy (gas), surface plasmon resonance (biomolecular). Distributed sensing: Brillouin (strain + temperature over km lengths, 1m resolution).
2. For FBG sensors, design the grating parameters. Bragg wavelength lambda_B = 2 * n_eff * Lambda where Lambda is the grating period. Bandwidth is determined by grating length and index modulation. Stronger gratings (higher reflectivity) give broader bandwidth. Typical: 10mm grating, 99% reflectivity, 0.2nm bandwidth. The wavelength shift encodes the measurand.
3. For interferometric sensors, select the configuration. Fabry-Perot: cavity length change from pressure or temperature, measured by fringe counting or white-light interrogation. Mach-Zehnder: phase difference between sensing and reference arms, highly sensitive (can detect sub-pm fiber length changes). Sagnac: rotation sensing (fiber optic gyroscope). Michelson: similar to Mach-Zehnder but reflected.
4. Analyze cross-sensitivity. FBGs respond to both strain and temperature simultaneously. Discriminate using: two FBGs at different wavelengths (different strain-optic coefficients), an unstrained reference FBG for temperature compensation, or a combined FBG + Fabry-Perot sensor. For distributed Brillouin sensing, separate strain and temperature using both Brillouin frequency shift and intensity.
5. Check if the environment demands special fiber. High temperature (> 300C) requires metal-coated or sapphire fiber (FBGs on standard fiber erase above 300C; regenerated FBGs survive to 1000C). Radiation environment: radiation-hardened fiber (fluorine-doped core) to resist radiation-induced attenuation. Hydrogen-rich environment: hermetic carbon coating to prevent hydrogen darkening.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
