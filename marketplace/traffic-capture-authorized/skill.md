# Traffic Capture Authorized

Capture network traffic on authorized segments using approved monitoring points.

## Inputs

- `network-segments`: Authorized network segments to monitor
- `capture-duration`: How long to capture traffic

## Outputs

- `pcap-files`: Captured packet capture files
- `capture-metadata`: Timestamp, duration, volume, and segment details

## Process

1. Configure capture points on authorized network taps or span ports
2. Run packet capture for the specified duration
3. Index and tag capture files by segment and time window

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
