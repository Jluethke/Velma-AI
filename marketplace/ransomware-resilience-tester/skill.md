# Ransomware Resilience Tester

Test whether backups are resilient to ransomware by checking for tampering and immutability.

## Inputs

- `backup-inventory`: Backup systems to test
- `key-management-findings`: Key management findings for attack path analysis

## Outputs

- `ransomware-resilience-results`: Results of ransomware resilience testing
- `immutability-status`: Whether each backup system enforces immutable storage

## Process

1. Test whether an attacker with admin access to production can also delete or modify backups
2. Check for immutable storage (WORM, object lock) on backup targets
3. Verify that backup credentials are not accessible from production systems
4. Test whether backup agents can be disabled or reconfigured by a compromised admin account

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
