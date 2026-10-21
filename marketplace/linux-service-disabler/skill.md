# Linux Service Disabler

Disable unnecessary systemd services and remove unneeded packages.

## Inputs

- `benchmark-profile`: CIS benchmark profile
- `server-role`: Server role determining required services

## Outputs

- `disabled-services`: List of services stopped and masked
- `removed-packages`: List of packages removed from the system

## Process

1. List all enabled systemd services
2. Disable and mask services not required for the server role
3. Remove unnecessary packages (telnet, rsh, talk, etc.)
4. Verify that required services still function

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
