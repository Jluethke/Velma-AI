# Endpoint App Whitelister

Configure application whitelisting or control policies to prevent unauthorized software execution.

## Inputs

- `os-type`: Operating system
- `approved-applications`: List of approved applications and their publishers

## Outputs

- `whitelist-config`: Applied application control policy
- `whitelist-test-results`: Verification that unauthorized executables are blocked

## Process

1. Configure AppLocker (Windows), Santa (macOS), or fapolicyd (Linux)
2. Create rules allowing approved applications by publisher or hash
3. Set the policy to enforce mode
4. Test that an unauthorized executable is blocked

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
