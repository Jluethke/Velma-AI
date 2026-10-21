# Dns Recursion Restrictor

Restrict recursive DNS queries to internal clients only.

## Inputs

- `dns-software`: DNS server software
- `rate-limit-config`: Rate limiting already configured

## Outputs

- `recursion-config`: Applied recursion restriction settings
- `recursion-test`: Verification that external recursive queries are denied

## Process

1. Configure allow-recursion to include only internal client subnets
2. Disable recursion on authoritative-only servers
3. Test that recursive queries from internal clients succeed
4. Test that recursive queries from external IPs are refused

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
