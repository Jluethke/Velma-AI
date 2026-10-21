# Dns Rebinding Domain Setup

Set up a controlled DNS rebinding test domain with configurable TTL and A record switching.

## Inputs

- `internal-service-list`: List of internal services to target
- `test-domain`: Domain to use for rebinding tests

## Outputs

- `rebinding-domain-config`: DNS configuration with TTL and record switching setup
- `domain-ready-status`: Confirmation that the test domain is resolving correctly

## Process

1. Configure DNS records with low TTL values
2. Set up A record switching between external and internal IPs
3. Verify DNS propagation and resolution behavior

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
