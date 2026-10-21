# Apt Profile Selection

Select the APT profile and map TTPs from threat intelligence to the authorized exercise.

## Inputs

- `threat-intelligence`: Threat intel reports relevant to the target organization
- `authorization-scope`: Written scope and rules of engagement
- `target-profile`: Target organization industry, size, and known defenses

## Outputs

- `apt-profile`: Selected APT actor profile and rationale
- `ttp-playbook`: Mapped MITRE ATT&CK techniques for the simulation

## Process

1. Review threat intelligence for adversaries targeting the organization's sector
2. Select the APT profile that represents the most relevant threat
3. Map specific MITRE ATT&CK techniques to each phase of the kill chain
4. Define success criteria and abort conditions for each technique

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
