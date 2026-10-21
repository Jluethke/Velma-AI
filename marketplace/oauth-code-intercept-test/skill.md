# Oauth Code Intercept Test

Test for authorization code interception through referrer leakage, history, and logging.

## Inputs

- `redirect-findings`: Redirect test results
- `oauth-flow-map`: OAuth flow map

## Outputs

- `code-intercept-findings`: Authorization code interception vulnerabilities
- `leakage-channels`: Channels through which codes leak

## Process

1. Check if authorization codes appear in referrer headers
2. Test for code leakage through browser history and server logs
3. Verify single-use enforcement on authorization codes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
