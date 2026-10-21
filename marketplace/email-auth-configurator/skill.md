# Email Auth Configurator

Configure authentication requirements for mail access and sending.

## Inputs

- `domain-name`: The email domain
- `tls-config`: TLS settings already in place

## Outputs

- `auth-config`: Applied authentication configuration
- `auth-test-results`: Verification that unauthenticated access is denied

## Process

1. Require authentication for IMAP and POP3 access
2. Require SMTP AUTH for message submission
3. Disable plaintext authentication mechanisms (allow only encrypted)
4. Test that unauthenticated access is rejected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
