# Initial Access Execution

Establish initial access through the approved vector (phishing, exposed service, or supplied foothold).

## Inputs

- `ttp-playbook`: Approved initial access techniques
- `authorization-scope`: Approved access vectors and limitations

## Outputs

- `initial-foothold`: Description of the established initial access
- `access-timeline`: Timeline of initial access activities and detections

## Process

1. Execute the approved initial access technique with careful logging
2. Establish persistence on the compromised system
3. Document all actions taken and timestamps for the debrief
4. Note any detection alerts or blue team responses observed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
