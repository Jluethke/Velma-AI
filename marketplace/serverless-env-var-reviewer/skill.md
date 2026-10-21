# Serverless Env Var Reviewer

Review environment variable handling for secrets exposure.

## Inputs

- `function-inventory`: Functions with environment variables
- `cloud-account-access`: Cloud account credentials

## Outputs

- `env-var-findings`: Secrets in plaintext env vars, unencrypted, or logged
- `secrets-handling-status`: Whether functions use secrets managers instead of env vars

## Process

1. List all environment variables per function and classify their contents
2. Identify secrets stored as plaintext environment variables
3. Check whether environment variables are encrypted with KMS
4. Verify that secrets are not logged during function execution

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
