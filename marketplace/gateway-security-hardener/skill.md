# Gateway Security Hardener

Harden the gateway security configuration.

## Inputs

- `route-configuration`: The routing configuration
- `policy-configuration`: The policy configuration

## Outputs

- `security-configuration`: Security hardening: TLS settings, IP filtering, request size limits, header injection prevention
- `security-test-results`: Results of security testing against the gateway

## Process

1. Configure TLS: minimum TLS 1.2, strong cipher suites, HSTS header.
2. Configure request size limits to prevent payload-based attacks.
3. Configure IP allowlisting or blocklisting as needed.
4. Set security headers (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
