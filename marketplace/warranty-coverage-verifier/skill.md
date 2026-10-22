# Warranty Coverage Verifier

Verify that the vehicle and the repair are covered under the manufacturer warranty.

## Inputs

- `vehicle-info`: VIN, mileage, and in-service date
- `repair-needed`: Description of the repair or component failure

## Outputs

- `coverage-determination`: Whether the repair is covered, the applicable warranty (bumper-to-bumper, powertrain, extended), and any exclusions
- `claim-requirements`: Manufacturer requirements for the claim (photos, measurements, failed parts retention)

## Process

1. Check the VIN against the manufacturer warranty database for coverage status.
2. Verify the vehicle is within the mileage and time limits for the applicable warranty.
3. Confirm the failed component or symptom is covered and not excluded.
4. Note the specific documentation requirements for this type of claim.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
