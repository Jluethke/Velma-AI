# Network Port Disabler

Disable unused physical and logical ports on network devices.

## Inputs

- `device-inventory`: List of network devices with model and firmware version
- `port-usage-map`: Map of which ports are in use and their purpose

## Outputs

- `disabled-ports-log`: Record of ports shut down or disabled
- `active-port-list`: Final list of active ports and their assignments

## Process

1. Inventory all physical and logical interfaces on each device
2. Identify ports not connected to any device or service
3. Administratively shut down unused ports
4. Assign unused ports to a black-hole VLAN

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
