# Tps Arc Jet Testing Validation

Design and execute arc jet tests to validate TPS material performance and calibrate thermal response models.

## Inputs

- `tps-material-map`: Selected materials and their thickness
- `tps-design-environments`: Heating conditions to replicate in testing
- `tps-thickness-map`: Nominal and margined thicknesses

## Outputs

- `test-matrix`: Arc jet test conditions, sample geometry, and instrumentation plan
- `test-results`: Measured recession rate, back-face temperature, and material response data
- `model-calibration`: Updated material response model parameters from test data

## Process

1. Select the arc jet facility: NASA Ames has the largest arc jets (60 MW IHF for high enthalpy, AHF for medium), Arnold Engineering (AEDC) has several, and university facilities exist at smaller scale. Match the facility capability to the test conditions needed: enthalpy (MJ/kg), heat flux (W/cm^2), surface pressure (atm), and test duration (seconds to minutes).
2. Design test samples: flat-faced cylinder models (stagnation point test, simplest geometry for model comparison), wedge models (shear flow for acreage conditions), and seam/gap models (for tiled systems). Instrument with in-depth thermocouples at known depths, surface pyrometer, and recession measurement (real-time laser or pre/post measurement).
3. Define the test matrix: at minimum, test at the nominal design condition, at the peak heating condition with margin, and at an off-nominal high condition. Test multiple samples for statistical confidence. Include a range of heat fluxes to map the material's performance envelope. For ablators, include long-duration tests at moderate heat flux (heat load driven) and short-duration tests at high heat flux (recession rate driven).
4. Execute tests and collect data: arc jet produces a high-enthalpy gas stream that simulates entry heating. Measure heat flux with a calibration probe (slug calorimeter or Gardon gauge) before and after each material test. Record back-face temperature rise, surface temperature (two-color pyrometer), surface recession (real-time if possible), and mass loss (weigh sample before and after).
5. Calibrate the material response model: compare predicted recession, char depth, and back-face temperature to measured values. Adjust model parameters (decomposition kinetics, char thermal conductivity, gas permeability, emissivity) within physically reasonable bounds to match the test data. A model that matches arc jet data gives confidence in flight predictions.
6. Perform post-test analysis: section the samples to measure char depth and pyrolysis depth. Compare to model predictions. Use SEM to examine the char microstructure. For ablators, identify the recession mechanism (oxidation, sublimation, mechanical removal). Document any unexpected behavior (delamination, spallation, excessive roughening).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
