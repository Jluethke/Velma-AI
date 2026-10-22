# Medication Source Collector

Collect the current medication list from all available sources.

## Inputs

- `patient-id`: Patient identifier for record lookup
- `care-transition-type`: Admission, transfer, or discharge

## Outputs

- `source-med-lists`: Medication lists from patient, pharmacy, and EHR
- `source-discrepancies`: Differences noted between sources

## Process

1. Pull the medication list from the EHR.
2. Obtain a list from the patient or caregiver.
3. Request a medication history from the pharmacy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
