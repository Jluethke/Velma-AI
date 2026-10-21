# Expired Domain Cname Check

Check for CNAME records pointing to expired domains that can be re-registered.

## Inputs

- `third-party-cnames`: All CNAME records to external targets
- `ns-takeover-results`: NS takeover results

## Outputs

- `expired-domain-findings`: CNAME targets with expired or available domains
- `registration-feasibility`: Cost and feasibility to register each expired domain

## Process

1. Extract the registrable domain from each CNAME target
2. Check WHOIS for expiration status and registration availability
3. Verify that registering the domain would give control over the CNAME response
4. Assess the cost and TLD restrictions for each available domain

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
