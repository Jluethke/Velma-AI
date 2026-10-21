# Serverless Event Injection Tester

Test each trigger type for event injection vulnerabilities.

## Inputs

- `trigger-map`: Event sources and their functions
- `function-inventory`: Function configurations

## Outputs

- `injection-test-results`: Results of event injection attempts per trigger type
- `input-validation-gaps`: Functions that do not validate event payloads

## Process

1. Craft malicious payloads for each trigger type (SQL injection in API Gateway, path traversal in S3 keys)
2. Test whether functions validate and sanitize event data before processing
3. Test for deserialization vulnerabilities in event parsing
4. Check whether error messages leak internal details

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
