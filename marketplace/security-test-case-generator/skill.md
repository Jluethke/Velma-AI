# Security Test Case Generator

Generate security test cases from the ranked attack paths, including the data each test needs.

## Inputs

- `attack-trees`: Goal-to-step decompositions for each threat
- `attack-path-rankings`: Paths ranked by feasibility and impact

## Outputs

- `test-cases`: Security test cases with preconditions and expected results
- `test-data-requirements`: Inputs, accounts, and fixtures each test needs

## Process

1. Turn each ranked attack path into one or more concrete test cases
2. Define preconditions, attacker action, and expected secure outcome
3. List the test data, accounts, and fixtures each case requires
4. Tag each test case with the threat and path it exercises

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
