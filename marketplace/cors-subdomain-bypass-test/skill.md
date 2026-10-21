# Cors Subdomain Bypass Test

Test for subdomain-based origin bypass where attacker-controlled subdomains are trusted.

## Inputs

- `null-origin-results`: Null origin results
- `cors-policies`: CORS policies

## Outputs

- `subdomain-bypass-results`: Subdomain bypass test results
- `trusted-patterns`: Origin matching patterns that are too permissive

## Process

1. Test with origins matching *.target.com patterns
2. Try prefix and suffix matching bypass (e.g., evil-target.com)
3. Test with origins containing the target as a substring

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
