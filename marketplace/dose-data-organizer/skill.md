# Dose Data Organizer

Organize raw dose-response data: log-transform concentrations, normalize responses, flag outliers, and structure for fitting.

## Inputs

- `raw-dose-response-data`: Concentration-response pairs with replicates
- `assay-metadata`: Units, vehicle control values, positive control values, assay type

## Outputs

- `organized-data`: Cleaned data with log-concentrations, normalized responses, and replicate structure
- `normalization-record`: How normalization was done (0% and 100% reference points)

## Process

1. Log-transform concentrations (base 10 or natural log, stated explicitly).
2. Normalize responses to the vehicle control (0%) and positive control (100%).
3. Flag statistical outliers within replicate groups using Grubbs test or similar.
4. Structure the data as columns: log_concentration, response, replicate_id, treatment_group.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
