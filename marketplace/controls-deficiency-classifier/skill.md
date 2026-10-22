# Controls Deficiency Classifier

Classify identified deficiencies and recommend improvements.

## Inputs

- `design-gaps`: Design deficiencies found
- `exceptions-found`: Operating effectiveness exceptions

## Outputs

- `deficiency-report`: Classified deficiencies (deficiency, significant deficiency, material weakness)
- `remediation-plan`: Recommended actions to address each deficiency

## Process

1. Classify each deficiency by severity (deficiency, significant deficiency, material weakness).
2. Assess the compensating controls that partially mitigate the risk.
3. Develop specific remediation recommendations for each deficiency.
4. Assign remediation owners and target completion dates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
