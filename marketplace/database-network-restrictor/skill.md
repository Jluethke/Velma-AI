# Database Network Restrictor

Restrict network access to the database to only required client hosts.

## Inputs

- `database-type`: Database product type
- `access-config`: Authentication and access settings

## Outputs

- `network-config`: Applied network restrictions (listen address, pg_hba, firewall rules)
- `connectivity-test`: Results of access testing from authorized and unauthorized hosts

## Process

1. Configure the database to listen only on required interfaces
2. Set host-based access controls (pg_hba.conf or equivalent)
3. Configure firewall rules to allow database port only from application servers
4. Test connectivity from authorized and unauthorized source addresses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
