# Retry Circuit Abuse Tester

Test for abuse potential in circuit breaker and retry mechanisms.

## Inputs

- `service-topology`: Service topology map
- `communication-matrix`: Communication patterns between services

## Outputs

- `retry-abuse-findings`: Findings on retry storm and circuit breaker abuse potential
- `cascading-failure-risks`: Paths where retry abuse could cause cascading failures

## Process

1. Test whether an attacker can trigger retry storms by causing specific error responses
2. Check whether circuit breakers can be manipulated to deny service to legitimate callers
3. Identify cascading failure paths where one service's failure causes unbounded retries in others
4. Verify that retry budgets and circuit breaker thresholds prevent amplification

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
