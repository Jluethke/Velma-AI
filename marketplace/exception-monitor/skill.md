# Exception Monitor

Track and monitor active exceptions, compensating controls, and expiration dates.

## Inputs

- `exception-record`: Active exception to monitor
- `compensating-controls`: Controls to verify are operating

## Outputs

- `monitoring-report`: Status of compensating controls and any incidents
- `exception-register`: Updated register of all active and expired exceptions

## Process

1. Verify compensating controls are operating as intended
2. Monitor for security incidents related to the excepted control
3. Send renewal notices before expiration
4. Update the exception register with current status

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
