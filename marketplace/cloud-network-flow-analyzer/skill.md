# Cloud Network Flow Analyzer

Analyze network flow logs to trace attacker communication patterns.

## Inputs

- `preserved-evidence`: Preserved network flow logs
- `api-anomalies`: Flagged API events for correlation with network activity

## Outputs

- `flow-analysis`: Analysis of network flows including suspicious connections
- `external-endpoints`: External IPs and domains involved in the incident

## Process

1. Parse VPC Flow Logs, NSG Flow Logs, or VPC Flow Records
2. Identify connections to known malicious IPs or unusual destinations
3. Quantify data transfer volumes to detect exfiltration
4. Correlate network flows with API events by timestamp and source

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
