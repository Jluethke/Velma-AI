# Nosql Js Injection Test

Test for JavaScript injection in NoSQL query engines that evaluate server-side JS.

## Inputs

- `operator-injection-results`: Operator injection results
- `nosql-inventory`: NoSQL inventory

## Outputs

- `js-injection-results`: JavaScript injection test results
- `code-execution-evidence`: Evidence of server-side JavaScript execution

## Process

1. Test for $where clause injection with tautology payloads
2. Attempt to inject sleep() or other timing-measurable functions
3. Test mapReduce and group functions for JavaScript injection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
