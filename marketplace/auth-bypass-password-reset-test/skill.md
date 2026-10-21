# Auth Bypass Password Reset Test

Test password reset flow for vulnerabilities including token predictability and account takeover.

## Inputs

- `mfa-bypass-results`: MFA bypass results
- `target-application`: Target application

## Outputs

- `password-reset-findings`: Password reset vulnerability findings
- `token-security-assessment`: Assessment of reset token security

## Process

1. Test for predictable or short password reset tokens
2. Check for host header injection in reset emails
3. Test for reset token reuse and expiration enforcement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
