# Http Smuggling Credential Hijack Test

Test for credential hijacking through request splitting and response queue poisoning.

## Inputs

- `cache-poison-results`: Cache poisoning results
- `internal-access-findings`: Internal access findings

## Outputs

- `credential-exposure-findings`: Findings on credential exposure through smuggling
- `impact-severity`: Severity rating of credential exposure risk

## Process

1. Test for response queue poisoning that captures other users' responses
2. Assess whether session tokens or credentials are exposed
3. Rate the impact and exploitability of each finding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
