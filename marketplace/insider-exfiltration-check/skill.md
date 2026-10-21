# Insider Exfiltration Check

Check for data exfiltration indicators across all available channels.

## Inputs

- `access-anomalies`: Identified anomalous access patterns
- `data-access-timeline`: Timeline of subject's data access

## Outputs

- `exfiltration-findings`: Evidence of data exfiltration or lack thereof
- `channel-analysis`: Analysis of each potential exfiltration channel

## Process

1. Check USB and removable media logs for large file copies
2. Review email and messaging for outbound file transfers
3. Check cloud storage sync activity (personal cloud, file sharing)
4. Analyze network traffic for unusual outbound data volumes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
