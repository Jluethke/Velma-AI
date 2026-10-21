# Http Smuggling Server Chain Id

Identify the server chain including load balancers, reverse proxies, and application servers.

## Inputs

- `target-url`: Target URL for the authorized test
- `engagement-scope`: Authorized scope of the engagement

## Outputs

- `server-chain-map`: Map of all servers in the request processing chain
- `header-parsing-differences`: Observed differences in header parsing between servers

## Process

1. Send probing requests to identify intermediary servers
2. Fingerprint each server's HTTP implementation
3. Document Content-Length and Transfer-Encoding handling differences

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
