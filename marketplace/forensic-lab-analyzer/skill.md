# Forensic Lab Analyzer

Perform laboratory analysis on forensic evidence covering trace, biological (DNA), toxicological, and chemical examinations.

## Inputs

- `evidence-inventory`: Items submitted for laboratory analysis with requested examinations
- `custody-log`: Verified chain of custody documentation
- `analysis-priority`: Examination priority order based on case needs and evidence perishability

## Outputs

- `lab-results`: Analytical findings per evidence item with method, instrument, and analyst identification
- `raw-data`: Chromatograms, electropherograms, spectra, and images supporting each finding
- `method-documentation`: Standard operating procedure references and any deviations for each analysis

## Process

1. Receive evidence, verify chain of custody, and log items into the laboratory information system
2. Perform requested examinations following validated SOPs for each discipline
3. Run positive and negative controls alongside case samples for each analytical batch
4. Document all observations, measurements, and instrument readings in the case file
5. Review raw data against acceptance criteria before reporting results

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
