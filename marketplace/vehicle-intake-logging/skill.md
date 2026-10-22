# Vehicle Intake Logging

Receive a vehicle at the shop and log the customer complaint, vehicle information, and initial observations.

## Inputs

- `customer-complaint`: What the customer says is wrong with the vehicle
- `vehicle-info`: Year, make, model, mileage, VIN, and license plate

## Outputs

- `intake-record`: Logged vehicle information, customer complaint, and initial observations
- `work-order-number`: Assigned work order number for tracking

## Process

1. Record the vehicle year, make, model, mileage, VIN, and license plate.
2. Log the customer complaint in their own words.
3. Note any visible damage, warning lights, or obvious symptoms during the walkaround.
4. Assign a work order number and set the status to awaiting diagnosis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
