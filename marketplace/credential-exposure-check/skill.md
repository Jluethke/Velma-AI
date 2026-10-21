# Credential Exposure Check

Check for exposed credentials in authorized breach databases and public repositories.

## Inputs

- `employee-profiles`: Email addresses and usernames to check
- `red-team-scope`: Authorization for credential exposure checking

## Outputs

- `exposed-credential-report`: Credentials found in breach databases with source and age
- `reuse-risk-assessment`: Likelihood of credential reuse based on password age and policy

## Process

1. Query authorized breach intelligence services for known email exposures
2. Check public code repositories for committed credentials or API keys
3. Search paste sites and forums for leaked data related to the target
4. Assess the likelihood of credential reuse based on breach age and the target's password policy

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
