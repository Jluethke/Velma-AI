# Dns Rate Limiter

Configure DNS response rate limiting to prevent amplification attacks.

## Inputs

- `dns-software`: DNS server software
- `dnssec-config`: DNSSEC already configured

## Outputs

- `rate-limit-config`: Applied rate limiting settings
- `rate-limit-test`: Verification that excessive queries are rate-limited

## Process

1. Enable response rate limiting (RRL) in the DNS server configuration
2. Set per-client and per-prefix rate limits appropriate for normal traffic
3. Configure slip ratio to drop rather than truncate excess responses
4. Test rate limiting with a controlled high-volume query tool

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
