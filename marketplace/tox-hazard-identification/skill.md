# Tox Hazard Identification

Identify the chemical or agent hazard by reviewing toxicological databases, animal study summaries, and epidemiological evidence.

## Inputs

- `agent-name`: Name or CAS number of the substance under review
- `exposure-context`: Where and how exposure occurs (occupational, environmental, dietary)

## Outputs

- `hazard-profile`: Summary of known toxic endpoints, target organs, and mechanisms
- `evidence-table`: Table of studies with species, route, dose, and observed effects

## Process

1. Search toxicological databases (IRIS, ATSDR, ECHA) for the substance
2. Compile animal and human study results by endpoint and route of exposure
3. Classify each endpoint by strength of evidence (sufficient, limited, inadequate)
4. Produce the hazard profile with the evidence table

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
