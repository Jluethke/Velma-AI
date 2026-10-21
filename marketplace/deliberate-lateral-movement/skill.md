# Deliberate Lateral Movement

Perform slow and deliberate lateral movement to reach target systems while evading detection.

## Inputs

- `c2-channel`: Active C2 for remote operations
- `ttp-playbook`: Lateral movement techniques to employ

## Outputs

- `compromised-systems`: List of systems accessed during lateral movement
- `credential-harvest`: Credentials obtained during movement

## Process

1. Enumerate the network from the foothold to identify lateral movement targets
2. Harvest credentials from memory, files, and network traffic
3. Move laterally using living-off-the-land techniques to reduce detection
4. Document each pivot point and the technique used

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
