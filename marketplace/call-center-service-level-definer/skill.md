# Call Center Service Level Definer

Define the service levels for call center operations.

## Inputs

- `business-requirements`: Customer service goals and SLA commitments
- `call-volume-forecast`: Expected call volumes by hour and day

## Outputs

- `service-level-targets`: Targets for answer time, abandon rate, handle time, and first-call resolution
- `staffing-model`: Staffing requirements by hour to meet service level targets

## Process

1. Set the target answer speed (e.g., 80% of calls answered within 20 seconds).
2. Set the maximum abandon rate, average handle time target, and first-call resolution target.
3. Model the staffing requirement using the call volume forecast and service level targets.
4. Document the service level agreement for internal and external use.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
