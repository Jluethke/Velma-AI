# Spectral Analysis And Quantification

Process the raw spectra to extract quantitative results: baseline correction, peak fitting, multivariate calibration, and uncertainty estimation.

## Inputs

- `raw-spectra`: Measured spectral data for all samples and references
- `calibration-data`: Wavelength and intensity calibration, reference standards of known concentration

## Outputs

- `quantitative-results`: Analyte concentrations or composition for each sample, with uncertainty (confidence interval or prediction interval from the calibration model)
- `spectral-identification`: Peak assignments to molecular vibrations or electronic transitions, library match scores for unknown identification

## Process

1. Baseline correction: for absorption/Raman spectra with sloping or curved baselines, fit a polynomial or use the asymmetric least squares (ALS) algorithm to estimate the baseline. Subtract it. For derivative spectroscopy (1st or 2nd derivative), the baseline is removed automatically but noise is amplified.
2. Peak fitting: model each spectral feature as a Voigt profile (convolution of Gaussian instrument broadening and Lorentzian natural linewidth) or simplified as Gaussian or Lorentzian. Fit the peak position, width, and amplitude using nonlinear least squares (Levenberg-Marquardt). Report the goodness of fit (reduced chi-squared, residuals).
3. Univariate calibration: for a single analyte with a well-resolved peak, plot peak area or height vs concentration for the standards. Fit a linear (Beer-Lambert) or polynomial model. Compute R^2, standard error of calibration (SEC), and limit of detection (LOD = 3.3 * sigma_blank / slope).
4. Multivariate calibration: for complex mixtures with overlapping peaks, use partial least squares (PLS) regression. Build the model on the calibration set: optimize the number of latent variables by cross-validation (leave-one-out or k-fold), minimizing the root mean squared error of cross-validation (RMSECV). Validate on an independent test set: report RMSEP (root mean squared error of prediction).
5. For unknown identification: search the spectrum against a reference library (NIST, SDBS, or in-house). The match algorithm computes the correlation coefficient or hit quality index (HQI) between the unknown and each library entry. Report the top matches with HQI scores. For mixtures, use spectral subtraction or MCR-ALS (multivariate curve resolution) to deconvolve overlapping spectra.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
