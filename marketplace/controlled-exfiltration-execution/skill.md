# Controlled Exfiltration Execution

Execute data exfiltration through approved channels and document the detection response.

## Inputs

- `staged-data`: Data staged for exfiltration
- `c2-channel`: C2 channel for exfiltration
- `ttp-playbook`: Approved exfiltration techniques

## Outputs

- `exfiltration-results`: Results of exfiltration attempts and detection response
- `apt-simulation-report`: Final APT simulation report with full timeline and findings

## Process

1. Execute exfiltration through approved channels (C2, DNS, HTTPS)
2. Document whether DLP or network monitoring detected the exfiltration
3. Clean up all implants and artifacts from compromised systems
4. Compile the full timeline and findings into the APT simulation report

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
