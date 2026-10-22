# Optical Interrogator Design

Design the interrogation system that reads the optical sensor and converts its response to a calibrated measurement.

## Inputs

- `sensing-mechanism`: Selected sensor type and its signal characteristics
- `sensitivity-resolution-spec`: Required measurement bandwidth and resolution
- `sensor-element-design`: Sensor element parameters

## Outputs

- `interrogation-system`: Complete interrogator design (source, detector, demodulation algorithm)
- `noise-limited-resolution`: Calculated minimum detectable signal from noise analysis
- `multiplexing-capacity`: Number of sensors supportable on one fiber and the multiplexing method

## Process

1. For FBG sensors, select the interrogation method. Scanning tunable filter (moderate speed, high resolution): a piezo-scanned Fabry-Perot filter sweeps across the reflected spectrum. Spectrometer-based (high channel count, moderate speed): dispersive element plus CCD/InGaAs array. Edge filter (highest speed, moderate resolution): position the FBG wavelength on the slope of a filter transmission curve. For dynamic strain measurement (kHz bandwidth), use interferometric demodulation.
2. Calculate noise-limited wavelength resolution. For a spectrometer interrogator, the resolution depends on the grating pitch and detector pixel count. For a scanning filter, it depends on the filter finesse and scan repeatability. Typical achievable: 1 pm wavelength resolution (about 0.8 microstrain or 0.1C for a standard FBG). Shot noise and detector noise set the fundamental limit.
3. For interferometric sensors, select the demodulation scheme. Homodyne: simple but susceptible to signal fading at quadrature points. Heterodyne: frequency offset between arms, giving AC interference signal immune to fading. Phase-generated carrier (PGC): sinusoidal modulation of the interferometer, demodulate using J1 and J2 Bessel function harmonics. PGC is the standard for high-performance interferometric sensing.
4. Design multiplexing. WDM for FBGs: each FBG at a different Bragg wavelength, limited by source bandwidth divided by per-sensor wavelength range (typically 40-80 FBGs in C-band with 2nm spacing). TDM: pulse the source and time-gate returns from FBGs at different positions along the fiber. Combined WDM-TDM for hundreds of sensors. OFDR (optical frequency domain reflectometry) for distributed sensing with mm-level spatial resolution over short distances.
5. Specify the sampling rate and data acquisition. Match to the measurand bandwidth (structural health monitoring: 1-100 Hz; vibration: 1-50 kHz; acoustic emission: 100 kHz to 1 MHz). Anti-aliasing filter before digitization. Bit resolution from the dynamic range requirement (16-bit ADC for 90dB dynamic range).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
