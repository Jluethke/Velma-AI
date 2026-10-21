# Log Collection Aggregation

Collect logs from all relevant systems and aggregate them.

## Inputs

- `evidence-source-list`: All identified evidence sources
- `incident-details`: Incident details for scoping log collection

## Outputs

- `collected-logs`: Aggregated logs from all relevant sources
- `log-inventory`: Inventory of collected logs with sources, date ranges, and formats

## Process

1. Collect authentication and access logs from identity systems
2. Collect firewall, proxy, and network device logs
3. Collect application and database logs from affected services
4. Export SIEM alerts and correlation data for the incident timeframe

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
