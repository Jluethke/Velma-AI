# Windows Firewall Configurator

Configure Windows Firewall rules to allow only required traffic.

## Inputs

- `server-role`: Server role determining required network ports
- `benchmark-profile`: CIS or STIG benchmark with firewall requirements

## Outputs

- `firewall-ruleset`: Applied firewall rules with allow and deny entries
- `firewall-change-log`: Record of rule changes from the default configuration

## Process

1. Enable Windows Firewall on all profiles (domain, private, public)
2. Configure inbound rules to allow only required ports for the server role
3. Configure outbound rules and set the default action to block
4. Test connectivity for required services after applying rules

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
