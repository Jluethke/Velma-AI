# Licensing Report Filer

Determine whether the incident requires a report to the licensing authority and file if required.

## Inputs

- `incident-report-draft`: The incident report
- `severity-classification`: The severity classification

## Outputs

- `licensing-report-status`: Whether a licensing report was filed, with the filing confirmation or the reason it was not required
- `regulatory-deadline-tracker`: Any regulatory deadlines for follow-up actions or additional reporting

## Process

1. Check the state licensing regulations for reportable incident categories (hospitalization, broken bone, head injury, allegation, death, communicable disease).
2. If the incident meets a reportable threshold, complete the licensing agency's incident report form within the required timeframe.
3. Submit the report to the licensing authority and retain the confirmation.
4. Track any follow-up requirements or deadlines imposed by the licensing agency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
