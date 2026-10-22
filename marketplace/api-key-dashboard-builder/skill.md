# Api Key Dashboard Builder

Build the self-service key management dashboard for consumers.

## Inputs

- `lifecycle-flows`: The key lifecycle flows
- `key-policy`: The key policy

## Outputs

- `dashboard-spec`: Dashboard specification: key list, usage stats, rotation controls, activity log
- `key-management-plan`: The complete API key management plan covering policy, lifecycle, dashboard, and security practices

## Process

1. Design the key list view: name, prefix (last 4 characters), created date, last used, status, permissions.
2. Design the key creation flow: name the key, select permissions, show the key once with copy button.
3. Design the usage stats view: requests per key over time, last used endpoint.
4. Design the rotation and revocation controls with confirmation steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
