# Jwt Algorithm Confusion Test

Test for algorithm confusion attacks including the none algorithm and HS256/RS256 switching.

## Inputs

- `decoded-tokens`: Decoded token components
- `token-usage-map`: Token validation endpoints

## Outputs

- `algorithm-confusion-results`: Results of algorithm confusion attack attempts
- `accepted-algorithms`: List of algorithms the server accepts for validation

## Process

1. Test with alg set to 'none' and empty signature
2. If RS256 is used, test HS256 with the public key as the HMAC secret
3. Test with alg set to other unexpected values (ES256, PS256)
4. Document which algorithm modifications are accepted by the server

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
