# Safety Concept Development

Develop the functional safety concept: decompose safety goals into safety requirements, allocate to system elements, and define the fault detection, indication, and response strategy.

## Inputs

- `safety-goals`: Top-level safety goals with ASIL ratings
- `system-description`: System architecture for allocation

## Outputs

- `safety-requirements`: Functional and technical safety requirements allocated to system elements with ASIL
- `fault-response-strategy`: For each safety-relevant fault, the detection method, diagnostic coverage, and safe response

## Process

1. Decompose safety goals into functional safety requirements (FSR). Each FSR addresses a specific failure mode that could violate the safety goal. Example: safety goal 'prevent unintended acceleration' decomposes into: 'the torque controller shall not command positive torque when the system commands zero torque' (addresses actuator fault), 'the perception system shall not generate false forward clearance when an obstacle exists' (addresses perception fault), 'the planning system shall not generate an acceleration command when the safety goal requires deceleration' (addresses planning fault).
2. Allocate FSRs to system elements and assign ASIL. ASIL can be decomposed across redundant elements using ASIL decomposition (e.g., ASIL D on a single channel becomes ASIL B(D) + ASIL B(D) on two independent channels). Decomposition requires demonstrated independence between channels (no common-cause failure modes). For software-heavy autonomous systems, achieving ASIL D through decomposition is the practical path because certifying a complex perception stack to ASIL D monolithically is prohibitively expensive.
3. Define the fault detection and diagnostic strategy. For each safety-relevant element, identify credible faults and design diagnostic tests. Hardware faults: use redundancy (dual-channel lockstep for compute, dual IMUs), built-in self-test (memory ECC, CPU self-test), and plausibility monitoring (compare independent sensor measurements). Software faults: diverse redundancy (different algorithms on different platforms), runtime monitoring (watchdog, execution time monitoring, output range checking). Calculate the diagnostic coverage for each fault type: the fraction of faults that the diagnostic can detect within the fault tolerant time interval.
4. Define the safe response for each detected fault. The minimal risk condition (MRC) is the state the system transitions to when a fault is detected that cannot be tolerated. For a highway autonomous vehicle, the MRC is typically a controlled stop on the shoulder. The transition to MRC must be achievable within the fault tolerant time interval using only the remaining functional elements. Define degraded operating modes for faults that reduce capability but do not require immediate MRC transition (e.g., single sensor failure with redundant backup).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
