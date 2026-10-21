# Stealth Lateral Movement

Perform lateral movement while minimizing detection by security monitoring.

## Inputs

- `foothold-documentation`: Current access and credentials
- `c2-channel-details`: Active communication channels

## Outputs

- `stealth-movement-log`: Lateral movement actions with techniques and detection status
- `expanded-access-map`: Additional hosts and accounts accessed

## Process

1. Use living-off-the-land techniques to avoid dropping additional tools
2. Move laterally using native OS utilities and administrative protocols
3. Avoid techniques known to generate high-fidelity alerts in the detected EDR product
4. Log timestamps for each action to correlate with blue team detection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
