# Dangling Dns Verification

Verify whether dangling DNS records can be claimed by an attacker.

## Inputs

- `third-party-cnames`: CNAME records to third-party services
- `service-status-map`: Service claim status

## Outputs

- `takeover-candidates`: Confirmed dangling records that can be claimed
- `claim-difficulty-rating`: Difficulty and requirements to claim each dangling service

## Process

1. Check for the specific error response indicating an unclaimed service on each provider
2. Verify the CNAME target namespace is available for registration
3. Check for partial takeover (service exists but custom domain is unverified)
4. Rate each candidate by claim difficulty and required attacker resources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
