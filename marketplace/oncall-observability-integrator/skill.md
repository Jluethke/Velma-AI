# Oncall Observability Integrator

Integrate the observability stack with the on-call system and produce the observability plan document.

## Inputs

- `alerting-rules`: Configured alert rules
- `alert-routing-config`: Alert routing configuration

## Outputs

- `oncall-integration`: Integration between alerts and on-call system
- `observability-plan-document`: Complete observability stack documentation

## Process

1. Connect alert routing to the on-call management platform
2. Configure alert grouping and deduplication
3. Test the full path from metric anomaly to on-call notification
4. Compile the observability plan document

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
