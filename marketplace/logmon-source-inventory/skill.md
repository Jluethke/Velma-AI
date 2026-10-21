# Logmon Source Inventory

Inventory all log sources, their coverage of security-relevant events, and their delivery to the central platform.

## Inputs

- `infrastructure-map`: Map of systems, applications, and network components
- `siem-access`: Access to the central logging or SIEM platform

## Outputs

- `source-inventory`: Catalog of all log sources with event types and delivery status
- `coverage-gaps`: Systems and event types not currently captured in central logging

## Process

1. List all systems expected to produce security logs (servers, applications, network devices, cloud services)
2. Verify that each source is actively delivering logs to the SIEM
3. Map event types collected per source (authentication, authorization, changes, errors)
4. Identify gaps where security-relevant events are not being captured

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
