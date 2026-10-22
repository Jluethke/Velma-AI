# Eo Detector Optics Design

Select the detector and design the optical system to meet sensitivity and resolution requirements.

## Inputs

- `spectral-band`: Operating wavelength band (visible, SWIR, MWIR, LWIR) based on target and environment
- `performance-requirements`: Detection/recognition/identification range, FOV, frame rate, NETD

## Outputs

- `detector-specification`: Selected detector technology with format, pixel pitch, spectral response, and noise characteristics
- `optical-design`: Focal length, f-number, aperture, and optical MTF

## Process

1. Select the spectral band from the application. Visible (0.4-0.7 um): reflected light, high resolution, needs illumination at night. SWIR (0.9-1.7 um): sees through haze, nightglow illumination, InGaAs detector. MWIR (3-5 um): thermal emission from hot targets (engines, exhaust), InSb or HgCdTe cooled to 77K. LWIR (8-12 um): thermal emission from ambient temperature objects (people, vehicles), HgCdTe or microbolometer.
2. Select the detector. Cooled photon detectors (InSb, HgCdTe): high sensitivity (D* > 1e11 Jones), fast response, require cryogenic cooling (Stirling, Joule-Thomson). Uncooled thermal detectors (microbolometer): lower sensitivity (NETD 30-50 mK), no cooling, lower cost, larger pixel pitch (17-25 um vs 10-15 um for cooled). CMOS/CCD for visible/SWIR.
3. Determine the focal length from the required IFOV (instantaneous field of view). IFOV = pixel_pitch / focal_length. For a 15 um pixel and 0.1 mrad IFOV requirement: f = 15e-6 / 0.1e-3 = 150 mm. Total FOV = IFOV * number_of_pixels. A 640x512 array with 0.1 mrad IFOV gives 3.7 deg x 2.9 deg FOV.
4. Select the f-number. Lower f-number collects more signal but increases optical aberrations and cost. For thermal imaging: f/1 to f/2 is typical for high-sensitivity cooled systems. For uncooled: f/1 to f/1.4 to compensate for lower detector sensitivity. The optical cutoff frequency f_c = 1/(lambda * f/#) determines the diffraction-limited MTF.
5. Compute NETD (Noise Equivalent Temperature Difference) for a thermal imager. NETD = (4 * f/#^2 * sqrt(delta_f)) / (pi * D* * delta_lambda * (dM/dT)) where delta_f is the noise bandwidth (frame_rate / 2 for snapshot), D* is the specific detectivity, delta_lambda is the spectral bandwidth, and dM/dT is the temperature derivative of spectral exitance integrated over the band. For a good LWIR system: NETD < 50 mK.
6. Document the optical prescription (focal length, aperture, f-number, number of elements, material), the detector format and cooling requirement, the system MTF at Nyquist frequency, and the NETD for thermal systems or SNR for visible systems.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
