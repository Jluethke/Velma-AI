# Covert Channel Detection

Check for DNS tunneling, ICMP tunneling, and other covert communication channels.

## Inputs

- `pcap-files`: Traffic data
- `anomaly-list`: Detected anomalies

## Outputs

- `covert-channel-findings`: Detected or suspected covert channels
- `exfiltration-indicators`: Signs of potential data exfiltration

## Process

1. Analyze DNS query patterns for tunneling indicators: high volume, long labels, unusual record types
2. Check ICMP traffic for abnormal payload sizes or patterns
3. Look for encoded data in HTTP headers, URL parameters, or other protocol fields

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
