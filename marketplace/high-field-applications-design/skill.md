# High Field Applications Design

Apply high-field HTS magnet technology to specific applications: NMR/MRI, fusion, and research magnets with application-specific requirements.

## Inputs

- `hts-coil-design`: HTS coil design approach
- `joint-design`: Joint design for the coil
- `stress-analysis-results`: Mechanical analysis

## Outputs

- `application-specific-design`: Magnet design tailored to the target application
- `field-homogeneity-analysis`: Field uniformity over the target volume
- `system-integration-plan`: Integration with cryogenics, power supply, and facility

## Process

1. Fusion toroidal field coils: demountable joints enable sector maintenance of the tokamak. Design for neutron irradiation (insulation dose limit, Ic degradation). Typical parameters: 20T at coil, 12T on plasma axis, 50 kA operating current, 10 GJ stored energy per coil set.
2. NMR magnets: field homogeneity requirement 0.01 ppm over sample volume. Persistent mode operation (superconducting switch). HTS insert boosting LTS outsert to reach beyond 1 GHz (23.5T). Screening currents are the dominant homogeneity challenge for HTS NMR.
3. Research magnets: user-access bore (up to 50mm for condensed matter, up to several meters for detector magnets). Pulsed vs DC operation. For pulsed: eddy current heating in structural materials, AC losses in conductor, and stored energy management dominate the design.
4. Design passive shimming: ferromagnetic or superconducting shim pieces placed to cancel measured field errors. For NMR, shim to <0.01 ppm. For accelerator magnets, correct to multipole specification. Iterative measurement-shimming process.
5. System integration: cryocooler-cooled (no liquid helium) for smaller magnets, enabling maintenance-free operation. Conduction cooling requires careful thermal link design from coil to cryocooler cold head. Power supply: high-current, low-voltage with precise regulation for persistent-mode charging.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
