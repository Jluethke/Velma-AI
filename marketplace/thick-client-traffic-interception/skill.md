# Thick Client Traffic Interception

Intercept and analyze network traffic between the thick client and its backend services.

## Inputs

- `application-binary`: The running thick client application
- `binary-analysis-results`: Known endpoints and communication protocols from static analysis

## Outputs

- `intercepted-traffic`: Captured and decoded network communications
- `api-endpoints-discovered`: Backend API endpoints and their parameters

## Process

1. Configure a proxy to intercept HTTP/HTTPS traffic from the client
2. Bypass certificate pinning if implemented
3. Capture and analyze non-HTTP protocols (TCP, WebSocket, custom binary)
4. Document all backend API endpoints, parameters, and authentication tokens

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
