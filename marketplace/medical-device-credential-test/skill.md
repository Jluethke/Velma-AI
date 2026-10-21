# Medical Device Credential Test

Test for default credentials, hardcoded accounts, and weak authentication mechanisms on the device.

## Inputs

- `device-specifications`: Device model for credential database lookup
- `protocol-inventory`: Authentication endpoints to test

## Outputs

- `credential-findings`: Default and weak credential findings
- `authentication-weaknesses`: Authentication mechanism flaws

## Process

1. Test known default credentials for the device vendor and model
2. Check for hardcoded service accounts in firmware and configuration files
3. Test for authentication bypass on management and clinical interfaces
4. Assess password policy enforcement and lockout mechanisms

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
