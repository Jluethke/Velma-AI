# Ns Delegation Takeover Test

Test for NS delegation takeover where nameserver records point to expired or unclaimed domains.

## Inputs

- `dns-record-map`: Full DNS record map including NS records
- `takeover-candidates`: CNAME takeover candidates for comparison

## Outputs

- `ns-takeover-results`: NS delegation takeover opportunities found
- `zone-control-impact`: Impact of gaining zone control through NS takeover

## Process

1. Identify NS records that delegate to external domains
2. Check whether the NS target domain is expired or available for registration
3. Assess the impact of zone control (full DNS control over all subdomains)
4. Check for lame delegation where NS servers do not respond authoritatively

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
