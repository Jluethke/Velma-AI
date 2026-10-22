# Outage Detector

Detect and confirm a grid outage event.

## Inputs

- `alarm-data`: SCADA alarms, smart meter data, or customer outage reports
- `grid-topology`: Description of the grid topology and feeder map

## Outputs

- `outage-scope`: Confirmed outage scope: affected feeders, estimated customers, and probable cause
- `initial-assessment`: Initial damage assessment and estimated restoration time

## Process

1. Correlate SCADA alarms, smart meter last-gasp signals, and customer reports to confirm the outage.
2. Identify the affected feeders and substations using the grid topology.
3. Estimate the number of affected customers.
4. Assess the probable cause (weather, equipment failure, vehicle accident, vegetation) from available data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
