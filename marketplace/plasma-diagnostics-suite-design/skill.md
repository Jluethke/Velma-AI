# Plasma Diagnostics Suite Design

Design the plasma diagnostic suite for measuring the key physics parameters with required accuracy and time resolution.

## Inputs

- `transport-coefficients`: Transport analysis results
- `confinement-prediction`: Confinement time prediction
- `operating-scenario`: Target plasma parameters

## Outputs

- `diagnostics-suite`: Complete diagnostic set with measurement parameters, accuracy, and coverage
- `integration-plan`: Port allocation, sight-line access, and neutron shielding for diagnostic components

## Process

1. Map measurements to physics requirements: Te profile (Thomson scattering: pulsed Nd:YAG, spatial resolution 1 cm, time resolution 10 ms), ne profile (Thomson + interferometry for line-integrated, reflectometry for edge), Ti profile (charge exchange recombination spectroscopy using NBI), rotation (same CXRS system).
2. Current profile: motional Stark effect (MSE) using NBI-produced fast ions in the magnetic field. Faraday rotation polarimetry for line-integrated current density. Both needed for q-profile reconstruction.
3. Radiated power: bolometry (resistive bolometers, AXUV diodes for fast events) with tomographic inversion for 2D radiation distribution. Visible and VUV spectroscopy for impurity identification and concentration.
4. Edge and divertor: Langmuir probes (ne, Te, floating potential at the divertor target), infrared thermography (surface temperature, heat flux), visible cameras (Dalpha emission for recycling, impurity line emission), Thomson scattering for pedestal (high spatial resolution, ~5mm).
5. Neutron diagnostics: fission chambers and scintillator detectors for total neutron yield (fusion power), neutron cameras with collimated detectors for emission profile (fast ion confinement), activation foils for absolute calibration, neutron spectrometry for ion temperature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
