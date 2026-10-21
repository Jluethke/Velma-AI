# Forensic Logging Readiness Assessor

Assess whether logging architecture supports forensic investigation after a breach.

## Inputs

- `component-inventory`: System component inventory
- `authn-assessment`: Authentication assessment for correlating log gaps with auth events

## Outputs

- `logging-coverage-map`: Map of which events are logged across the system
- `forensic-readiness-score`: Score indicating how well logs support incident investigation

## Process

1. Inventory all log sources and what events they capture
2. Check log integrity protections (tamper-evident, write-once, centralized collection)
3. Verify retention periods meet investigation timelines
4. Test that security-relevant events (authentication, authorization, data access) are captured with enough detail for reconstruction

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
