# Certificate Expiry Monitor

Configure monitoring and alerting for certificate expiration across all deployment locations.

## Inputs

- `certificate-inventory`: Complete certificate list with locations
- `expiration-timeline`: Sorted expiration schedule

## Outputs

- `monitoring-configuration`: Alert rules for 90, 60, 30, 14, and 7 day thresholds
- `notification-routing`: Who gets alerted at each threshold

## Process

1. Set up certificate monitoring probes for all endpoints
2. Configure alerting thresholds (90 days = info, 30 days = warning, 7 days = critical)
3. Route alerts to the responsible team based on certificate ownership
4. Test alerting by temporarily lowering thresholds

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
