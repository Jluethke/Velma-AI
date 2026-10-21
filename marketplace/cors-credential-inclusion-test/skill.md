# Cors Credential Inclusion Test

Check whether credential inclusion (cookies, auth headers) is allowed with permissive origins.

## Inputs

- `subdomain-bypass-results`: Subdomain bypass results
- `reflecting-endpoints`: Reflecting endpoints

## Outputs

- `credential-exposure-results`: Credential exposure through CORS results
- `exploitable-combinations`: Exploitable origin plus credential combinations

## Process

1. Test each permissive endpoint with withCredentials: true
2. Check for Access-Control-Allow-Credentials: true with reflected origins
3. Assess what authenticated data is accessible through CORS abuse

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
