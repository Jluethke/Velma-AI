# Oauth Token Leakage Check

Check for token theft through referrer headers, URL fragments, logs, and browser storage.

## Inputs

- `scope-escalation-findings`: Scope escalation findings
- `leakage-channels`: Known leakage channels

## Outputs

- `token-leakage-findings`: Token leakage vulnerabilities found
- `exposure-severity`: Severity assessment of token exposure

## Process

1. Check for tokens in URL fragments (implicit flow)
2. Test for token exposure in referrer headers and logs
3. Assess token storage security in browser (localStorage vs secure cookie)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
