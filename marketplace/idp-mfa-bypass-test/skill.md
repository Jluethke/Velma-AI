# Idp Mfa Bypass Test

Test multi-factor authentication for bypass scenarios including downgrade attacks and recovery flow weaknesses.

## Inputs

- `auth-flow-map`: Map of authentication flows with MFA configurations
- `token-findings`: Token handling weaknesses

## Outputs

- `mfa-bypass-findings`: MFA bypass paths and downgrade attack results
- `recovery-flow-findings`: Weaknesses in MFA recovery and backup code flows

## Process

1. Test whether MFA can be skipped by manipulating the authentication request
2. Check if MFA backup codes have adequate entropy and rate limiting
3. Test recovery flows (SMS, email) for interception or social engineering risk
4. Verify that MFA enrollment cannot be downgraded or removed without re-authentication

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
