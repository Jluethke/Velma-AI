# Chromatic Dispersion Management

Analyze and compensate chromatic dispersion and polarization mode dispersion to meet the required transmission distance and data rate.

## Inputs

- `link-budget-table`: Operating wavelength, fiber type, link distance
- `fiber-selection`: Chromatic dispersion coefficient of the selected fiber

## Outputs

- `dispersion-analysis`: Total chromatic dispersion (ps/nm), dispersion limit for the data rate, PMD (ps), DGD statistics, dispersion-limited reach vs power-limited reach
- `compensation-plan`: DCF module length and dispersion, fiber Bragg grating specifications, or electronic dispersion compensation method and DSP requirements

## Process

1. Compute the total chromatic dispersion: D_total = D * L (ps/nm) where D is the fiber dispersion coefficient. For G.652.D at 1550nm: D = 17 ps/(nm*km). Over 100km: D_total = 1700 ps/nm.
2. Compute the dispersion-limited distance: L_max = 1 / (16 * B^2 * |D| * delta_lambda) where B is the bit rate and delta_lambda is the source spectral width. For 10 Gb/s NRZ on G.652 at 1550nm with a DFB laser (delta_lambda = 0.1nm): L_max = 1 / (16 * (10e9)^2 * 17e-6 * 0.1) = about 60km.
3. For compensation, option 1: dispersion compensating fiber (DCF) with D = -100 ps/(nm*km). Length needed: L_DCF = D_total / 100. DCF adds insertion loss (~0.5 dB/km) and nonlinear penalty from small core area. Option 2: chirped fiber Bragg grating (compact, low loss, but narrower bandwidth).
4. For polarization mode dispersion: compute the mean DGD = PMD_coefficient * sqrt(L). For modern fiber (PMD < 0.1 ps/sqrt(km)) over 100km: DGD = 1 ps. The system penalty becomes significant when DGD > 10% of the bit period. At 10 Gb/s (100 ps bit period): DGD limit is 10 ps.
5. For 100G and above, electronic dispersion compensation in the coherent receiver DSP replaces optical compensation. The DSP applies an inverse filter matched to the measured channel response, compensating both chromatic dispersion and PMD adaptively.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
