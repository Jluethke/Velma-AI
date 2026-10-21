# Can Bus Traffic Analysis

Capture and analyze CAN bus traffic to identify message IDs, data patterns, and undocumented arbitration.

## Inputs

- `vehicle-interface`: CAN interface connection details (channel, bitrate)
- `authorization-scope`: Written scope of the authorized test
- `known-dbc-files`: Available DBC database files for message decoding

## Outputs

- `can-message-catalog`: Catalog of observed CAN IDs with decoded and unknown messages
- `traffic-baseline`: Baseline traffic patterns for anomaly detection

## Process

1. Connect to the CAN bus through the authorized interface and capture traffic
2. Decode known messages using available DBC files
3. Identify undocumented message IDs and their data patterns
4. Map message frequency and timing to establish the communication baseline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
