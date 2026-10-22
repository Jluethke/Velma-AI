# Spc Response Rule Definer

Define out-of-control response rules and reaction plans.

## Inputs

- `chart-setup-record`: Deployed chart configurations
- `process-capability`: Cp and Cpk values

## Outputs

- `response-rules`: Western Electric rules and reaction plans
- `spc-implementation-plan`: Complete SPC program documentation

## Process

1. Define which Western Electric rules to apply (1 point beyond 3 sigma, run of 7, etc.)
2. Write a reaction plan for each rule violation
3. Define escalation paths for persistent out-of-control conditions
4. Compile the full SPC implementation plan

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
