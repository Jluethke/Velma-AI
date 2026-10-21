# Attack Scenario Planner

Define attack scenarios and select MITRE ATT&CK techniques to test.

## Inputs

- `threat-model`: Threat model or threat intelligence for the target environment
- `environment-scope`: Description of the environment to test

## Outputs

- `attack-plan`: Ordered list of ATT&CK techniques to execute
- `success-criteria`: Criteria for each technique defining what counts as successful execution

## Process

1. Review the threat model to identify relevant threat actors and their TTPs
2. Select ATT&CK techniques aligned with those TTPs across the kill chain
3. Order techniques into logical attack paths from initial access through impact
4. Define success criteria and observable indicators for each technique

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
