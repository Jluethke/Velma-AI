# Cors Wildcard Reflection Test

Test for wildcard origin reflection where the server echoes back any Origin header.

## Inputs

- `endpoint-cors-map`: Endpoint CORS map
- `cors-policies`: CORS policies found

## Outputs

- `reflection-results`: Results of origin reflection tests
- `reflecting-endpoints`: Endpoints that reflect arbitrary origins

## Process

1. Send requests with attacker-controlled Origin values
2. Check if the Origin is reflected in Access-Control-Allow-Origin
3. Test with various origin formats to probe validation logic

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
