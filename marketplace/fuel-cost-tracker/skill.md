# Fuel Cost Tracker

Track fuel consumption and costs across the fleet.

## Inputs

- `fleet-inventory`: Current inventory with status, mileage, and condition
- `fleet-roster`: List of all vehicles in the fleet

## Outputs

- `fuel-report`: Fuel consumption and cost per vehicle and route
- `efficiency-rankings`: Vehicles ranked by fuel efficiency

## Process

1. Collect fuel purchase records by vehicle
2. Calculate cost per mile and gallons per mile for each vehicle
3. Identify vehicles with declining fuel efficiency
4. Produce the fuel report and efficiency rankings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
