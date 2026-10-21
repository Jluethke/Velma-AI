# Nosql Operator Injection Test

Test for NoSQL operator injection using MongoDB query operators like $gt, $ne, and $regex.

## Inputs

- `nosql-inventory`: NoSQL database inventory
- `injection-points`: Endpoints to test

## Outputs

- `operator-injection-results`: Results of operator injection tests
- `vulnerable-params`: Parameters vulnerable to operator injection

## Process

1. Inject $gt, $ne, $exists operators into query parameters
2. Test for $regex injection to extract data character by character
3. Confirm injection with differential response analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
