# System Reliability Calculation

Calculate system reliability metrics from the RBD and component failure rates, producing MTBF, mission reliability, and availability predictions.

## Inputs

- `component-failure-rates`: Lambda values for all components
- `reliability-block-diagram`: System RBD with redundancy
- `failure-rate-method-selection`: Method used for each component

## Outputs

- `system-mtbf`: Mean time between failures for the system, with confidence interval
- `mission-reliability`: Probability of completing a defined mission duration without failure
- `availability-prediction`: Steady-state availability A = MTBF / (MTBF + MTTR), with MTTR estimated from repair procedures and spare parts availability

## Process

1. For series elements: lambda_system = sum of all lambda_i. MTBF = 1/lambda_system. This applies when every element must work for the system to work. It is the baseline before redundancy credit.
2. For active parallel redundancy (both running, either sufficient): for two identical elements, lambda_parallel = 2 * lambda^2 * tau / (2*lambda*tau + 1), where tau is the repair or mission time. For rare events, this simplifies to lambda_parallel = lambda^2 * tau. The improvement over series is dramatic only when the detection and repair time is short relative to the failure interval.
3. For standby redundancy: the standby element has a dormant failure rate (often 10% of active rate) and a switching failure probability. System failure rate = lambda_active * (lambda_dormant * tau + P_switch_fail). If the standby unit is not tested periodically, the dormant failure accumulates.
4. For k-of-n voting: use the binomial distribution. P(fewer than k working) = sum from i=0 to k-1 of C(n,i) * R^i * (1-R)^(n-i). This is the system failure probability. For 2oo3 with identical elements: P(fail) = 3*q^2 - 2*q^3 where q = 1 - exp(-lambda*t).
5. Combine the subsystem results according to the RBD structure. Report MTBF, mission reliability for the specified mission duration, and steady-state availability. Include a Pareto chart showing which subsystems contribute most to the system failure rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
