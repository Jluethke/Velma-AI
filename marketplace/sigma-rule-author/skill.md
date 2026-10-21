# Sigma Rule Author

Write the Sigma rule with proper taxonomy, log source definition, and detection logic.

## Inputs

- `technique-profile`: Technique details including artifacts and procedures
- `log-source-mapping`: Available log sources and their relevant fields

## Outputs

- `draft-sigma-rule`: Sigma rule in YAML format with title, description, logsource, detection, and level
- `rule-metadata`: ATT&CK mapping, references, and author information

## Process

1. Define the logsource category, product, and service fields per Sigma taxonomy
2. Write the detection section with selection criteria and filter conditions
3. Set the level (informational, low, medium, high, critical) based on technique severity and confidence
4. Add ATT&CK tags, references, and false positive documentation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
