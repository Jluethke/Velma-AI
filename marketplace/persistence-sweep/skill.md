# Persistence Sweep

Confirm that no attacker persistence mechanisms remain on recovered systems.

## Inputs

- `source-verification`: Verified clean system sources
- `restored-systems`: Systems to sweep for persistence

## Outputs

- `sweep-results`: Results of the persistence sweep per system
- `clean-confirmation`: Confirmation that no persistence was found or all was removed

## Process

1. Run endpoint detection scans on all recovered systems
2. Check scheduled tasks, services, startup items, and cron jobs for unauthorized entries
3. Review user accounts and permissions for unauthorized additions
4. Check for unauthorized SSH keys, certificates, or API tokens

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
