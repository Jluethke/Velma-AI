# Knowledge Transfer Verification

Verify that the extracted knowledge actually transfers. Give the case studies and heuristics to a less experienced person and test whether they can make better judgment calls.

## Inputs

- `case-study-library`: Library of documented case studies
- `heuristic-catalog`: Catalog of expert heuristics

## Outputs

- `transfer-test-results`: Results of testing whether less experienced people make better decisions after reading the case studies and heuristics
- `tribal-knowledge-extraction-doc`: Complete documentation of the extraction process: identification, interview method, case study format, heuristic catalog, and transfer verification

## Process

1. Select a less experienced person in the same role. Give them a scenario from the case study library (without revealing the expert's judgment). Ask them what they would do and why.
2. Then give them the case studies and heuristics for that domain. Wait a week. Present a new scenario (different but in the same domain). Compare their judgment before and after the case study training.
3. If their judgment improves, the extraction worked. If it does not, the case studies are missing critical context. Go back to the knowledge holder and probe deeper.
4. The transfer test also reveals which case studies are most valuable for training. The ones that produce the biggest improvement in judgment are the ones to prioritize for new hires.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
