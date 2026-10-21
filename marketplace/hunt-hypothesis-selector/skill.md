# Hunt Hypothesis Selector

Select a threat hunting hypothesis based on threat intelligence, detection gaps, or emerging attack techniques.

## Inputs

- `threat-landscape`: Current threat intelligence reports and advisories
- `detection-coverage-map`: Map of MITRE ATT&CK techniques with current detection status

## Outputs

- `hunt-hypothesis`: Specific hypothesis to test, including the expected attacker behavior
- `attack-technique-profile`: Detailed description of the technique including data sources and artifacts

## Process

1. Review recent threat intelligence for techniques targeting your industry or technology stack
2. Identify gaps in the ATT&CK coverage map where no detection exists
3. Select the hypothesis that balances likelihood of occurrence with potential impact
4. Document the expected attacker behavior, artifacts, and data sources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
