# Spectral Data Acquisition

Acquire high-quality spectral data: optimize the signal-to-noise ratio, calibrate the wavelength and intensity axes, and handle baseline artifacts.

## Inputs

- `technique-selection`: Selected spectroscopic method and its operating parameters
- `instrument-configuration`: Source, detector, spectral range, resolution settings

## Outputs

- `raw-spectra`: Spectral data (intensity vs wavelength or wavenumber) for all samples, references, and blanks, with metadata (integration time, accumulations, date, sample ID)
- `calibration-data`: Wavelength calibration (reference lamp lines or known absorption features), intensity calibration (standard reference material or blackbody), dark current and background spectra

## Process

1. Collect a dark spectrum (source blocked) to measure the detector dark current and electronic offset. Collect a reference spectrum (no sample in beam for transmission, or white reference for reflectance) to establish the 100% baseline.
2. Optimize the integration time: the signal-to-noise ratio scales as sqrt(t) for shot-noise-limited detection and sqrt(N) for N co-added scans. Set the integration time so that the detector is near (but not at) saturation at the strongest spectral feature. For CCD detectors, check for cosmic ray spikes and remove them by median-filtering multiple accumulations.
3. For FTIR: set the mirror velocity (slow for MCT detector with long time constant, fast for DTGS). The spectral resolution is set by the maximum optical path difference: delta_sigma = 1 / (2 * OPD_max) in cm^-1. Apodization function (triangular, Happ-Genzel, Blackman-Harris) trades resolution for sidelobe suppression.
4. Wavelength calibration: for grating spectrometers, use a calibration lamp (Hg-Ar, Ne) with known emission lines spanning the spectral range. Fit a polynomial (wavelength vs pixel) of order 2-3. For FTIR, the HeNe reference laser provides intrinsic wavelength calibration (Connes advantage).
5. Collect multiple replicates (3-5 minimum) to assess measurement precision. Randomize the measurement order to separate drift from sample-to-sample variation. Include quality control samples (known concentration) at regular intervals.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
