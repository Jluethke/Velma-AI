# Http Smuggling Routing Test

Test for request routing manipulation through smuggled requests.

## Inputs

- `crafted-payloads`: Smuggling payloads
- `server-chain-map`: Server chain map

## Outputs

- `routing-results`: Results of routing manipulation tests
- `internal-access-findings`: Any internal endpoints reached through smuggling

## Process

1. Attempt to route requests to internal-only endpoints
2. Test for host header manipulation through smuggling
3. Document all routing anomalies observed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
