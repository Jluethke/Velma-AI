# Api Input Validation Testing

Test input validation and serialization handling across all API parameters for injection, type confusion, and overflow conditions.

## Inputs

- `endpoint-map`: Map of endpoints with parameter schemas
- `rate-limit-findings`: Rate limit status for tested endpoints

## Outputs

- `input-validation-findings`: List of input validation failures
- `serialization-findings`: Deserialization and type confusion vulnerabilities

## Process

1. Send malformed input types (string where integer expected, nested objects, oversized payloads).
2. Test for SQL injection, NoSQL injection, and command injection in all parameters.
3. Check for insecure deserialization in request bodies (JSON, XML, protobuf).
4. Test boundary conditions (empty strings, null bytes, maximum length values).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
