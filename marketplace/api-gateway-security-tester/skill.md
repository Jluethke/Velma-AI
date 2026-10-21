# Api Gateway Security Tester

Test the API gateway for bypass vulnerabilities and misconfigured security controls.

## Inputs

- `service-topology`: Service topology showing gateway position
- `unauthenticated-paths`: Known unauthenticated paths

## Outputs

- `gateway-test-results`: Results of API gateway security tests
- `bypass-vulnerabilities`: Methods to bypass the gateway and reach services directly

## Process

1. Test for direct access to backend services bypassing the gateway (IP direct, alternate ports)
2. Test rate limiting effectiveness and bypass techniques
3. Check input validation at the gateway (oversized requests, malformed headers, path traversal)
4. Verify that the gateway enforces authentication before routing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
