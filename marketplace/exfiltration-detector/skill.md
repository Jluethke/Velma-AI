# Exfiltration Detector

Detect data exfiltration by analyzing outbound data volumes and patterns.

## Inputs

- `reconstructed-sessions`: Rebuilt sessions for volume analysis
- `c2-candidates`: Identified C2 channels that may carry exfiltrated data

## Outputs

- `exfiltration-findings`: Identified data exfiltration events and volumes
- `data-loss-estimate`: Estimate of the volume and type of data exfiltrated

## Process

1. Compute outbound data volumes by destination
2. Identify sessions with unusually large uploads
3. Analyze C2 channels for embedded data transfer
4. Estimate total data loss based on observed transfers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
