# Cryogenic Shielding Thermometry

Design magnetic shielding, infrared filtering, and thermometry for reliable operation at millikelvin temperatures.

## Inputs

- `cryostat-type-selection`: Cryostat architecture
- `base-temperature-requirement`: Target base temperature
- `experimental-volume`: Dimensions and sensitivity of the experiment

## Outputs

- `magnetic-shielding-design`: Mu-metal and superconducting shield configuration with expected attenuation
- `ir-filtering-plan`: Infrared absorbers and light-tight design to suppress photon-induced quasiparticles
- `thermometry-plan`: Temperature sensors at each stage with calibration approach

## Process

1. Design magnetic shielding. Superconducting qubits are sensitive to magnetic flux noise and stray fields. Use a layered approach: room-temperature mu-metal shield (attenuation factor 100-1000 for DC fields), additional cryoperm shield at 4K (higher permeability when cold), and a superconducting aluminum or lead shield at base temperature (perfect diamagnetic shielding, Meissner effect). The superconducting shield must be cooled through Tc in the low-field environment to avoid trapping flux vortices.
2. Design infrared filtering. Stray infrared photons from warm stages generate quasiparticles in superconducting circuits, reducing qubit T1. Install infrared-absorbing filters (Eccosorb CR-110 or similar) at each radiation shield aperture. Make the mixing chamber stage light-tight (no line-of-sight from warm stages). Coaxial cable inner conductors act as waveguides for IR; add inline IR filters (lossy at > 100 GHz but transparent at microwave qubit frequencies).
3. Select thermometry for each stage. 50K and 4K: silicon diode or Cernox RTD (calibrated from 1.4K to 420K). Still and cold plate: RuO2 thick-film resistor (calibrated from 20 mK to 40K, good sensitivity below 1K). Mixing chamber: calibrated RuO2 or CMN (cerium magnesium nitrate) thermometer for accurate reading below 100 mK. The CMN susceptibility follows Curie law (1/T) down to 2 mK.
4. Calibrate thermometry. Use fixed-point devices (superconducting transition temperatures: tungsten 15.4 mK, beryllium 23.8 mK, iridium 112.4 mK, aluminum 1.175K, indium 3.407K) to verify the thermometer calibration at base temperature. For RuO2, the resistance-temperature curve must be individually calibrated (polynomial fit in log-log space). Self-heating: use low excitation current (1-10 nA at base temperature) to avoid Joule heating that biases the reading.
5. Vibration isolation. Mechanical vibrations couple to qubit coherence through piezoelectric effects in substrates and microphonic noise in cables. The pulse tube cooler generates vibrations at 1.4 Hz. Decouple using flexible bellows connections, heavy mixing chamber mass (acts as a low-pass mechanical filter), and vibration-damping mounts. Measure vibration spectra at the experiment stage with an accelerometer during commissioning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
