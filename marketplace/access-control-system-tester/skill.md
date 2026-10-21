# Access Control System Tester

Test badge, biometric, and mantrap access control systems for bypass vulnerabilities.

## Inputs

- `entry-point-inventory`: Inventory of entry points and their controls
- `access-control-policies`: Access policies to test against

## Outputs

- `access-control-findings`: Findings from testing each access control system
- `bypass-methods`: Methods that successfully bypassed access controls

## Process

1. Test badge readers for cloning vulnerability, relay attacks, and expired badge acceptance
2. Test biometric systems for spoofing (silicone fingerprints, printed photos, replay)
3. Test mantraps for tailgating detection and anti-passback enforcement
4. Attempt to use social engineering to gain entry through controlled doors

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
