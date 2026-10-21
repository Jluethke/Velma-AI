# Alert Receiver Classifier

Receive and categorize an incoming security alert by source, type, and initial severity.

## Inputs

- `alert-data`: Raw alert from SIEM, EDR, or other detection source
- `alert-source`: Name of the system that generated the alert

## Outputs

- `classified-alert`: Alert with category, type, and initial severity assigned
- `alert-timeline`: Timestamp sequence of alert-related events

## Process

1. Parse the alert payload and extract key fields (source IP, destination, user, process, rule name)
2. Categorize by type: malware, intrusion, policy violation, anomaly, or data loss
3. Assign initial severity based on the detection rule's priority and asset criticality

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
