# Serverless Trust Boundary Tester

Test function-to-function trust boundaries and inter-function authentication.

## Inputs

- `function-inventory`: Function inventory
- `injection-test-results`: Event injection results

## Outputs

- `trust-boundary-findings`: Missing authentication between functions and implicit trust issues
- `inter-function-map`: Map of which functions call which and how they authenticate

## Process

1. Trace all function-to-function invocations
2. Test whether calling functions authenticate to called functions
3. Check for shared IAM roles across functions that should be isolated
4. Verify that event payloads between functions are validated at each boundary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
