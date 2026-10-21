# Access Flow Identity Mapper

Map all access flows and verify identity checks at each step.

## Inputs

- `architecture-documentation`: Network and application architecture docs
- `identity-provider-config`: IdP configuration and federation settings
- `review-scope`: Systems and access patterns to review

## Outputs

- `access-flow-map`: Every access flow with identity verification points marked
- `identity-gap-list`: Access flows missing identity verification

## Process

1. Trace each user, service, and device access flow from request to resource
2. Verify that identity is checked at every step (not just at the perimeter)
3. Identify flows that rely on network location instead of identity for access decisions
4. Flag service-to-service communications that lack mutual authentication

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
