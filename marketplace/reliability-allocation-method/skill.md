# Reliability Allocation Method

Allocate the system reliability target to subsystems using methods that account for complexity, criticality, and achievability.

## Inputs

- `system-mtbf`: Predicted system MTBF
- `mission-reliability`: Mission reliability prediction
- `availability-prediction`: Availability prediction

## Outputs

- `subsystem-allocations`: MTBF or failure rate allocated to each subsystem, with rationale for the allocation method used
- `allocation-feasibility`: Assessment of whether each allocation is achievable with current technology, based on comparison with similar fielded equipment
- `improvement-priorities`: Ranked list of subsystems where reliability improvement investment has the highest system-level return, based on Birnbaum importance from the RBD

## Process

1. Choose the allocation method. Equal allocation (divide the system failure rate equally among n subsystems) is the simplest but ignores that some subsystems are inherently more reliable than others. AGREE allocation weights by complexity, criticality, operating time, and environmental severity. Feasibility-of-objectives allocation weights by the ratio of achievable to required reliability for similar equipment.
2. For AGREE allocation: weight_i = (complexity_i * operating_time_i * environment_severity_i * criticality_i) / sum of all weights. Allocated failure rate for subsystem i = system_failure_rate * weight_i / sum_weights. This gives a larger share of the failure budget to complex, continuously operating subsystems in harsh environments.
3. Check each allocation against the state of the art. If a subsystem is allocated an MTBF of 50,000 hours but similar fielded equipment achieves only 20,000 hours, the allocation is infeasible without a technology advancement. Flag infeasible allocations and either redistribute the budget or identify the design changes needed.
4. Calculate Birnbaum importance for each subsystem from the RBD: the partial derivative of system reliability with respect to subsystem reliability. Subsystems with high Birnbaum importance and low current reliability are the highest-return improvement targets. A subsystem with Birnbaum importance of 0.8 improves system reliability 4x faster per unit of subsystem improvement than one with importance 0.2.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
