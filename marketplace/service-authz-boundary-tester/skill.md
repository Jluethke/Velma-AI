# Service Authz Boundary Tester

Test authorization boundaries to find broken access control between services.

## Inputs

- `authn-test-results`: Authentication test results
- `service-topology`: Service topology map

## Outputs

- `authz-test-results`: Results of authorization boundary tests
- `privilege-escalation-paths`: Paths where one service can access another's resources beyond its intended scope

## Process

1. For each authenticated service pair, test access to resources outside the caller's intended scope
2. Check for horizontal privilege escalation (Service A accessing Service B's data for a different tenant)
3. Check for vertical privilege escalation (low-privilege service accessing admin endpoints)
4. Test whether internal services enforce authorization or rely solely on the API gateway

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
