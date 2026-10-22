# Neural Data Analysis Framework

Analyze electrophysiology data with appropriate statistical methods, multiple comparison corrections, and reproducibility measures.

## Inputs

- `session-data`: Recorded neural data with behavioral timestamps
- `research-question`: Hypothesis to test

## Outputs

- `analysis-results`: Statistical test results, effect sizes, confidence intervals, and population-level summaries
- `analysis-code-package`: Complete, executable analysis pipeline (preprocessing, feature extraction, statistical tests, figure generation) for reproducibility

## Process

1. Preprocess: artifact removal (see neural-artifact-removal chain), spike sorting (see spike-detection-and-sorting chain), LFP feature extraction (see lfp-spectral-analysis chain). Align neural data to behavioral events using the digital event timestamps. Define analysis windows relative to events (e.g., 200 ms before movement onset to 500 ms after).
2. Single neuron analysis. For each neuron, test whether firing rate differs between conditions using ANOVA (if comparing 3+ conditions) or t-test (2 conditions), with trial as the unit of observation. Report effect size (eta-squared for ANOVA, Cohen's d for t-test) alongside p-values. Apply multiple comparison correction across neurons: Benjamini-Hochberg false discovery rate (FDR) correction at q = 0.05, which is less conservative than Bonferroni and more appropriate for neural populations where many neurons are expected to be modulated.
3. Population-level analysis. Dimensionality reduction: PCA on population firing rate vectors to identify dominant patterns of activity. Neural state-space analysis: project population activity into the top 2-3 PCs and plot trajectories for different conditions. Decoding analysis: train a classifier (LDA, SVM) on population activity to determine how much condition information is present, using leave-one-out or stratified k-fold cross-validation. Report classification accuracy with 95% confidence interval from bootstrap.
4. Ensure reproducibility. Write the complete analysis pipeline as executable code (Python with NumPy/SciPy/scikit-learn, or MATLAB). Pin software versions. Use random seeds for reproducibility. Include the raw data path, all preprocessing parameters, statistical test specifications, and figure generation code. Data and code should be organized for sharing (e.g., DANDI archive for NWB data, GitHub for analysis code). Pre-register the analysis plan before data collection if testing a specific hypothesis (not exploratory).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
