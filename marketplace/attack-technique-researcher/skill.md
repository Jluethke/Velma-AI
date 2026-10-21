# Attack Technique Researcher

Research the attack technique to detect, including log artifacts and observable behaviors.

## Inputs

- `technique-id`: MITRE ATT&CK technique ID or description of the behavior to detect
- `environment-context`: Technology stack and log sources available in the environment

## Outputs

- `technique-profile`: Detailed profile of the technique including tools, procedures, and artifacts
- `log-source-mapping`: Map of which log sources capture which artifacts of the technique

## Process

1. Research the technique in ATT&CK, threat reports, and red team documentation
2. Identify the specific log events and fields that capture the technique's artifacts
3. Determine which log sources in the environment can observe these events
4. Note variations in how different tools and procedures execute the same technique

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
