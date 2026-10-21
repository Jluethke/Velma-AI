# Cors Null Origin Test

Test for null origin acceptance which can be triggered from sandboxed iframes and data URIs.

## Inputs

- `reflection-results`: Origin reflection results
- `endpoint-cors-map`: Endpoint CORS map

## Outputs

- `null-origin-results`: Results of null origin tests
- `null-accepting-endpoints`: Endpoints that accept null origin

## Process

1. Send requests with Origin: null header
2. Check if null is allowed with credentials
3. Test exploitation through sandboxed iframes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
