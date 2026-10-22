# Fleet Service Tracker

Track service history and costs for each fleet vehicle and the fleet as a whole.

## Inputs

- `maintenance-schedule`: Scheduled and completed maintenance events
- `vehicle-records`: Vehicle records to update with service data

## Outputs

- `fleet-service-log`: Service history for each vehicle with costs, dates, and work performed
- `fleet-cost-summary`: Total fleet maintenance cost by vehicle, by category, and over time

## Process

1. Record each completed service visit against the vehicle record.
2. Track costs by category (preventive maintenance, repairs, tires, fluids).
3. Calculate the cost per mile and cost per vehicle for the fleet.
4. Identify vehicles with above-average maintenance costs for replacement consideration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
