# Cors Endpoint Scan

Map all API endpoints and their CORS response headers.

## Inputs

- `target-application`: Target application and API URLs
- `test-credentials`: Authentication credentials for testing

## Outputs

- `endpoint-cors-map`: Map of endpoints to their CORS headers
- `cors-policies`: Distinct CORS policies found across the application

## Process

1. Send requests with varying Origin headers to all endpoints
2. Catalog Access-Control-Allow-Origin responses for each endpoint
3. Identify endpoints with credentials support enabled

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
