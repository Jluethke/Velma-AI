# Network Management Acl Setter

Configure access control lists to restrict management plane access to authorized hosts.

## Inputs

- `device-inventory`: Network devices to harden
- `snmp-config`: SNMP configuration for management access

## Outputs

- `management-acl`: Applied management access control lists
- `acl-change-log`: Record of ACL changes per device

## Process

1. Define the list of authorized management IP addresses or subnets
2. Apply ACLs to VTY lines restricting SSH access to authorized hosts
3. Apply ACLs to SNMP restricting polling to the monitoring server
4. Test management access from authorized and unauthorized sources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
