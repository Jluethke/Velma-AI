# Workaround Test Runner

Test each workaround. An untested workaround is a hypothesis. A tested workaround is a capability.

## Inputs

- `workaround-plans`: The designed workarounds
- `critical-function-list`: The functions being protected

## Outputs

- `test-results`: For each workaround: passed or failed, the actual time to execute, the actual degraded performance level, and the specific failures encountered
- `revised-workaround-plans`: Updated workaround plans incorporating the test findings

## Process

1. Schedule the test during a low-impact period. Simulate the dependency failure (disconnect the system, have the person step away, pause the vendor service).
2. Execute the workaround using the written procedure. Have someone who was not involved in designing it execute it to test the documentation.
3. Measure: how long did the switch take? What was the actual performance level? Were there steps that failed or were unclear?
4. Update the workaround plan with the findings. Schedule the next test (annually for critical workarounds, semi-annually for the most fragile).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
