# Token Leakage Scanner

Scan for token leakage in logs, referrer headers, browser history, and error messages.

## Inputs

- `flow-inventory`: OAuth flow inventory
- `redirect-test-results`: Redirect test results for correlation

## Outputs

- `token-leakage-findings`: All instances of token leakage found
- `oauth-security-report`: Complete OAuth implementation security report

## Process

1. Check server logs for tokens in query parameters, headers, or request bodies that are logged
2. Test whether tokens appear in browser history via URL fragments or query parameters
3. Check referrer headers: do pages with tokens in the URL leak them to third parties
4. Compile all OAuth findings into the security report with severity ratings and remediation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
