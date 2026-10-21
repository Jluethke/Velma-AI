# Credential Stuffing Check

Check for credential exposure in known breach databases.

## Inputs

- `hash-collection`: Organization password hashes
- `cracked-passwords`: Cracked cleartext passwords

## Outputs

- `breach-exposure`: Accounts with passwords found in known breaches
- `stuffing-risk-score`: Overall organization risk from credential stuffing

## Process

1. Check password hashes against Have I Been Pwned or equivalent breach databases
2. Identify accounts using passwords known to be in public breach data
3. Assess the organization's overall credential stuffing risk

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
