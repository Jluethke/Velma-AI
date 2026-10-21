# Network Snmpv3 Configurator

Configure SNMPv3 with authentication and encryption, replacing any SNMPv1 or v2c usage.

## Inputs

- `device-inventory`: List of network devices to configure
- `active-port-list`: Active ports for management access planning

## Outputs

- `snmp-config`: SNMPv3 configuration applied to each device
- `snmp-change-log`: Record of SNMP version and community string changes

## Process

1. Identify current SNMP versions and community strings in use
2. Create SNMPv3 users with authentication (SHA) and privacy (AES)
3. Remove SNMPv1 and v2c community strings
4. Test monitoring connectivity with the new SNMPv3 credentials

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
