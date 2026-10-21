# Jwt Leakage Assessment

Check for token leakage through referrer headers, logs, URLs, and browser storage.

## Inputs

- `token-usage-map`: Where tokens are stored and transmitted
- `claim-manipulation-results`: Claim manipulation results

## Outputs

- `leakage-findings`: Token leakage vectors identified
- `storage-security-assessment`: Security of token storage mechanisms

## Process

1. Check for tokens in URL query parameters (leaked via Referer header)
2. Check for tokens logged in server access logs or error messages
3. Assess browser storage security (HttpOnly, Secure, SameSite cookie flags)
4. Test for token theft through XSS if stored in localStorage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
