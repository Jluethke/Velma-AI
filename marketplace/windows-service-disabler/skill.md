# Windows Service Disabler

Disable unnecessary Windows services and features based on the server role.

## Inputs

- `benchmark-profile`: CIS or STIG benchmark profile
- `server-role`: Server role determining which services are required

## Outputs

- `disabled-services-list`: List of services and features that were disabled
- `service-change-log`: Record of each service state change with timestamp

## Process

1. List all running services and their startup types
2. Compare against the benchmark list of required services for this role
3. Disable each unnecessary service and record the change

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
