# Network Activity Mapper

Map the attacker's network activity across the captured traffic.

## Inputs

- `c2-candidates`: Identified C2 communications
- `exfiltration-findings`: Data exfiltration analysis
- `captured-credentials`: Credentials captured in transit

## Outputs

- `activity-map`: Visual map of attacker network movement and communications
- `network-iocs`: Network indicators of compromise (IPs, domains, ports, patterns)

## Process

1. Plot all attacker-attributed connections on a network diagram
2. Trace the sequence of lateral movement through the network
3. Catalog all external endpoints used by the attacker
4. Extract network indicators of compromise for detection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
