# Test Automation Scripter

Turn the automatable test cases into scripts and a harness configuration for repeatable runs.

## Inputs

- `test-cases`: Security test cases with preconditions and expected results
- `test-data-requirements`: Inputs, accounts, and fixtures each test needs

## Outputs

- `automated-test-scripts`: Scripts that run the automatable test cases
- `test-harness-config`: Environment and fixture setup for the scripts

## Process

1. Separate cases suited to automation from those needing manual testing
2. Script each automatable case with setup, action, and assertion
3. Configure the harness to provision the required test data
4. Record which cases remain manual and why

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
