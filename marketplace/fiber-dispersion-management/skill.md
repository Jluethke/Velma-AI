# Fiber Dispersion Management

Analyze and manage chromatic and polarization mode dispersion to ensure error-free transmission at the target data rate.

## Inputs

- `fiber-type-selection`: Fiber type with dispersion parameters
- `link-distance`: Total fiber length
- `modulation-format`: Modulation and data rate

## Outputs

- `dispersion-budget`: Chromatic dispersion and PMD budget versus tolerance
- `compensation-plan`: DCF modules, FBG, or DSP compensation approach
- `dispersion-map`: Accumulated dispersion versus distance along the link

## Process

1. Calculate accumulated chromatic dispersion: CD_total = D * L where D is the dispersion coefficient in ps/(nm*km). For G.652 at 1550nm, D is about 17 ps/(nm*km). A 10Gbps NRZ signal tolerates about 1000 ps/nm (roughly 60km of G.652 at 1550nm). A 100Gbps signal tolerates 16x less (about 60 ps/nm, or roughly 3.5km uncompensated).
2. For direct detection systems exceeding the dispersion limit, add dispersion compensating fiber (DCF) or chirped fiber Bragg gratings. DCF has high negative dispersion (-100 ps/nm/km) but adds loss (0.5 dB/km) and nonlinearity due to small effective area. Place DCF at amplifier sites to avoid excess loss.
3. For coherent systems, chromatic dispersion is compensated digitally in the DSP. The equalizer applies the inverse transfer function of the fiber. This eliminates DCF entirely, reducing cost and nonlinear penalty. Verify that the DSP's dispersion compensation range covers the link (modern coherent DSPs handle 100,000+ ps/nm).
4. Analyze polarization mode dispersion (PMD). PMD accumulates as sqrt(L): PMD_total = PMD_coeff * sqrt(L_km). Modern fiber has PMD_coeff < 0.1 ps/sqrt(km). A 100km link gives < 1ps PMD. The rule of thumb: PMD tolerance is about 10% of the symbol period. At 10Gbps (100ps symbol), 10ps PMD is the limit. Coherent DSP also compensates PMD adaptively.
5. Build the dispersion map showing accumulated dispersion versus distance. For long-haul DWDM, the map influences nonlinear performance. A residual dispersion per span of 30-50 ps/nm with full compensation at the receiver is typical for 10Gbps channels. For coherent 100Gbps+, a simple uncompensated (no inline DCF) link with DSP compensation at the receiver is standard practice.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
