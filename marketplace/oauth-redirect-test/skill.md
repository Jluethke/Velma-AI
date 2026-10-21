# Oauth Redirect Test

Test the authorization endpoint for open redirect vulnerabilities through redirect URI manipulation.

## Inputs

- `oauth-flow-map`: Map of OAuth flows
- `redirect-uri-list`: Registered redirect URIs

## Outputs

- `redirect-findings`: Open redirect test results
- `bypass-techniques`: Redirect URI validation bypass techniques found

## Process

1. Test for exact match vs pattern match validation on redirect URIs
2. Attempt URI manipulation (subdomain, path traversal, fragment injection)
3. Test for open redirect chains that exfiltrate authorization codes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
