# Service Ownership Verification

Verify that all active third-party service claims match the organization.

## Inputs

- `third-party-cnames`: All CNAME records to third-party services
- `expired-domain-findings`: Expired domain findings

## Outputs

- `ownership-verification-results`: Whether each active service is claimed by the organization
- `orphaned-services`: Services still active but not managed by the organization

## Process

1. Check each active third-party service for correct branding and content
2. Identify services that appear abandoned but still resolve
3. Check for stale SSL certificates on third-party services
4. Verify that the organization's account controls each claimed service

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
