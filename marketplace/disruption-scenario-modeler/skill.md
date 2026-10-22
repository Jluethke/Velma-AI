# Disruption Scenario Modeler

Model disruption scenarios using threat-vulnerability-consequence analysis and simulate cascading effects across coupled subsystems.

## Inputs

- `resilience-metric-set`: Metrics to evaluate per scenario
- `system-architecture`: System structure showing dependencies and coupling between subsystems

## Outputs

- `disruption-scenario-set`: Defined scenarios with trigger event, affected subsystems, propagation path, and expected performance impact
- `cascading-failure-analysis`: For each scenario, the cascade sequence showing how failure propagates through dependencies

## Process

1. Enumerate threat categories: natural (earthquake, flood, extreme weather), technical (component failure, software defect, power loss), human (operator error, malicious attack, supply chain disruption), organizational (budget cut, personnel turnover, regulatory change).
2. For each threat, identify the directly affected subsystem (vulnerability) and the immediate performance impact (consequence). Then trace the cascade: if subsystem A fails, which subsystems depend on A? For each dependent subsystem B, what is B's response to A's failure? Does B have fallback? If B fails, trace further.
3. Model the cascade timing: some cascades propagate in milliseconds (electrical), some in minutes (thermal), some in days (supply chain). The cascade speed determines whether intervention is possible.
4. For each scenario, simulate (or reason about) the performance profile Q(t): initial performance, disruption onset, minimum performance, adaptation, recovery. Evaluate the resilience metrics defined earlier.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
