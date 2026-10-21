# Lateral Movement Assessment

Assess indicators of lateral movement within the network.

## Inputs

- `pcap-files`: Traffic data
- `anomaly-list`: Anomalies to investigate

## Outputs

- `lateral-movement-findings`: Detected lateral movement indicators
- `network-path-map`: Communication paths between internal hosts

## Process

1. Map internal host-to-host communication patterns
2. Flag authentication attempts across multiple systems from single sources
3. Detect known lateral movement protocols: PSExec, WMI, RDP, SSH brute force
4. Assess whether network segmentation is limiting lateral paths

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
