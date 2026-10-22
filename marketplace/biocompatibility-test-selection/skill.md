# Biocompatibility Test Selection

Classify the device by body contact type and duration per ISO 10993-1, then select the required biological tests and chemical characterization studies.

## Inputs

- `device-description`: Materials, manufacturing processes, sterilization method, and intended use of the device
- `contact-classification`: Body contact type (surface, external communicating, implant) and duration (limited, prolonged, permanent)

## Outputs

- `biological-evaluation-plan`: List of required biological tests and chemical characterization studies with rationale for each
- `material-characterization-plan`: Plan for chemical characterization of extractables and leachables from all patient-contacting materials

## Process

1. Classify the device per ISO 10993-1 Table A.1: body contact nature (surface contacting skin, mucosal membrane, breached surface; external communicating blood path, tissue/bone, circulating blood; implant tissue/bone, blood) and duration (limited: under 24h, prolonged: 24h to 30 days, permanent: over 30 days).
2. From the classification, identify the required biological endpoints per ISO 10993-1 Table A.1: cytotoxicity, sensitization, irritation, acute systemic toxicity, subacute/subchronic/chronic toxicity, genotoxicity, implantation, hemocompatibility, carcinogenicity, reproductive/developmental toxicity.
3. Evaluate existing data before planning new tests. If the same material with the same processing and sterilization has been tested for another device with equal or greater contact, that data may be leveraged with documented equivalence rationale.
4. Plan chemical characterization per ISO 10993-18. Identify extraction conditions (solvents, temperature, time) that simulate worst-case clinical use. Polar and non-polar solvents at elevated temperature for exhaustive extraction.
5. For each biological endpoint without adequate existing data, specify the test standard (ISO 10993-5 for cytotoxicity, ISO 10993-10 for irritation, ISO 10993-11 for systemic toxicity), sample preparation, and test lab requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
