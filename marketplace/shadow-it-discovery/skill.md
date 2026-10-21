# Shadow It Discovery

Identify unauthorized services and shadow IT from network traffic.

## Inputs

- `protocol-inventory`: Observed protocols and services
- `pcap-files`: Traffic data

## Outputs

- `unauthorized-services`: Services not in the authorized inventory
- `shadow-it-map`: Map of unapproved applications and their usage

## Process

1. Compare observed services against the authorized application inventory
2. Identify cloud services, personal VPNs, and unapproved tools
3. Map which endpoints are using unauthorized services

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
