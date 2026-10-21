# Exposure Change Monitor

Monitor for changes in the attack surface: new assets, removed protections, and newly exposed services.

## Inputs

- `discovered-assets`: Baseline asset inventory
- `asset-fingerprints`: Baseline technology fingerprints

## Outputs

- `change-alerts`: Alerts for new assets, configuration changes, and removed protections
- `trend-data`: Attack surface size over time (asset count, open port count, exposed service count)

## Process

1. Schedule recurring scans (daily for critical, weekly for standard)
2. Diff each scan against the previous baseline
3. Alert on new assets, new open ports, downgraded TLS, and removed WAF protections
4. Track the total attack surface size over time

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
