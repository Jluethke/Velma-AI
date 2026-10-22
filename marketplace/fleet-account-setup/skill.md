# Fleet Account Setup

Set up the fleet account with vehicle roster, billing terms, and contact information.

## Inputs

- `fleet-details`: Company name, contact, billing address, and payment terms
- `vehicle-roster`: List of fleet vehicles with VIN, year, make, model, and unit number

## Outputs

- `fleet-account`: Configured fleet account with billing terms and authorized contacts
- `vehicle-records`: Individual vehicle records created for each fleet unit

## Process

1. Create the fleet account with billing terms (net 30, PO required, fleet discount rate).
2. Enter each vehicle into the system with VIN, unit number, and current mileage.
3. Set up the authorized contacts who can approve repairs.
4. Configure the billing method (per vehicle, consolidated monthly, PO-based).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
