# Osint Report Writer

Produce the OSINT investigation report with findings, evidence, confidence assessments, and recommendations.

## Inputs

- `relationship-map`: Entity relationship graph
- `pattern-analysis`: Identified behavioral patterns
- `confidence-assessment`: Confidence levels for each finding
- `source-reliability-ratings`: Source ratings

## Outputs

- `osint-report`: Complete OSINT investigation report with executive summary, findings, evidence, and recommendations
- `indicators-of-interest`: Extracted indicators (domains, IPs, emails, handles) for downstream use

## Process

1. Write the executive summary answering each intelligence requirement
2. Document each finding with supporting evidence and confidence rating
3. Include the relationship map and pattern analysis as appendices
4. List indicators of interest for monitoring or further investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
