# Linux Firewall Configurator

Configure iptables or nftables firewall rules for the server role.

## Inputs

- `server-role`: Server role determining required ports
- `benchmark-profile`: CIS benchmark with firewall requirements

## Outputs

- `firewall-ruleset`: Applied iptables or nftables rules
- `firewall-change-log`: Changes made to the firewall configuration

## Process

1. Set the default policy to DROP for INPUT and FORWARD chains
2. Allow established and related connections
3. Add rules for required inbound ports based on server role
4. Persist the rules across reboots

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
