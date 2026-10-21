# Distributed Tracing Data Auditor

Audit distributed tracing for sensitive data exposure in trace spans and logs.

## Inputs

- `service-topology`: Service topology map
- `gateway-test-results`: Gateway test results for correlation

## Outputs

- `tracing-data-findings`: Sensitive data found in trace spans, tags, and logs
- `microservices-security-report`: Complete microservices security audit report

## Process

1. Sample trace data and inspect spans for PII, credentials, tokens, or internal identifiers
2. Check whether trace data is accessible to unauthorized parties
3. Verify that sensitive fields are redacted before traces are stored or exported
4. Compile all findings from all steps into the final microservices security audit report

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
