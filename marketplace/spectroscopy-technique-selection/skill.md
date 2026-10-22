# Spectroscopy Technique Selection

Select the spectroscopic technique and instrument configuration matched to the analyte, matrix, required sensitivity, and information type (identification, quantification, structural).

## Inputs

- `measurement-objective`: What to measure (chemical identity, concentration, molecular structure, material composition), target analyte, matrix (gas, liquid, solid, biological tissue), required detection limit, spatial resolution
- `sample-constraints`: Destructive vs non-destructive, in-situ vs ex-situ, sample size, transparency, fluorescence interference, sample preparation options

## Outputs

- `technique-selection`: Primary technique (UV-Vis absorption, FTIR, Raman, fluorescence, NMR, mass spec) with rationale, secondary confirmatory technique if needed
- `instrument-configuration`: Source (lamp, laser wavelength and power), dispersive element (grating lines/mm, FT interferometer), detector (CCD, InGaAs, MCT), spectral range, resolution, integration time

## Process

1. Map the measurement objective to technique categories. Molecular functional groups: FTIR (mid-IR, 4000-400 cm^-1) for strong absorption bands of O-H, N-H, C=O, C-H; Raman for symmetric vibrations and aqueous samples (water is a weak Raman scatterer but strong IR absorber). Crystal structure: XRD. Elemental composition: XRF, ICP-OES, ICP-MS. Trace organics: MS (GC-MS, LC-MS).
2. For absorption spectroscopy, compute the required path length from Beer-Lambert: A = epsilon * c * l. At the detection limit concentration, the absorbance must exceed the instrument noise floor (typically A > 0.001 for a good spectrometer). Path length l = A_min / (epsilon * c_limit). For gases, use a multipass cell (White or Herriott) to achieve path lengths of meters to kilometers.
3. For Raman spectroscopy, select the excitation wavelength based on the trade-off between scattering cross-section (proportional to 1/lambda^4: shorter wavelength gives stronger signal) and fluorescence background (longer wavelength reduces fluorescence). 532nm: strong signal, high fluorescence risk. 785nm: good compromise for organic materials. 1064nm (FT-Raman): minimal fluorescence but requires InGaAs detector.
4. For fluorescence: check if the analyte is natively fluorescent or requires a fluorescent label. Select excitation wavelength at the absorption maximum of the fluorophore. Stokes shift (emission wavelength - excitation wavelength) must be large enough for the emission filter to reject scattered excitation light. Quantum yield and molar extinction coefficient together determine the detection limit.
5. Specify the spectral resolution: for gas-phase molecules with narrow rotational lines, resolution < 0.5 cm^-1 (FTIR or high-resolution grating). For liquids and solids with broad bands, 4-8 cm^-1 is sufficient. For Raman, the spectrograph resolution depends on the grating groove density, slit width, and focal length: delta_lambda = slit_width * cos(beta) / (m * n * f) where m is the diffraction order, n is the groove density, and f is the focal length.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
