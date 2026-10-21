# Iot Default Credentials Check

Test for default, weak, and shared credentials across device management interfaces.

## Inputs

- `protocol-map`: Map of device network services
- `embedded-secrets`: Credentials found in firmware analysis

## Outputs

- `credential-findings`: Default and weak credential access results
- `auth-mechanism-assessment`: Assessment of authentication mechanisms on all interfaces

## Process

1. Test vendor default credentials on all management interfaces
2. Check whether credentials found in firmware work on the live device
3. Test for credential reuse across multiple devices of the same model
4. Assess password complexity requirements and account lockout policies

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
