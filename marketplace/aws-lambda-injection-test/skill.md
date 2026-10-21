# Aws Lambda Injection Test

Test Lambda functions for event injection and insecure configuration.

## Inputs

- `aws-scope`: Lambda functions in scope
- `iam-inventory`: Lambda execution roles and their permissions

## Outputs

- `lambda-findings`: Lambda injection and misconfiguration vulnerabilities
- `lambda-data-exposure`: Sensitive data accessible through Lambda environment or execution

## Process

1. Enumerate Lambda functions, their triggers, and execution roles
2. Test for event injection through each trigger type (API Gateway, S3, SQS)
3. Check for sensitive data in environment variables and layer code
4. Test execution role permissions for over-privileged access

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
