# Verification Planning

Create the verification plan mapping each requirement to its verification method, level, and event using the V-model structure.

## Inputs

- `requirements-set`: Complete set of system, subsystem, and component requirements with traceability
- `system-architecture`: Architecture showing test access points, built-in test capabilities, and integration sequence

## Outputs

- `verification-cross-reference-matrix`: Each requirement mapped to: verification method (test, analysis, inspection, demonstration), verification level (component, subsystem, system, operational), and the specific test or analysis that verifies it
- `test-architecture`: How the test environment is structured at each level: what is real hardware, what is simulated, what instrumentation is needed, and what the test environment fidelity is relative to the operational environment
- `verification-schedule`: When each verification event occurs in the program schedule, with predecessor dependencies (component tests complete before subsystem integration)

## Process

1. Assign a verification method to every requirement. Test: measure actual performance under controlled conditions. Analysis: calculate or simulate when testing is impractical or uneconomical (e.g., lifetime reliability, radiation hardness). Inspection: verify physical characteristics by examination (dimensions, labels, workmanship). Demonstration: operate the system and observe that it performs the required function (less rigorous than test, suitable for qualitative requirements).
2. Assign a verification level using the V-model. Component-level verification catches issues earliest and cheapest. Subsystem-level catches integration issues. System-level catches end-to-end issues. Operational-level catches environment and user-interaction issues. Verify at the lowest level possible: a voltage accuracy requirement is verified at the component bench, not at system integration.
3. Define the test environment fidelity at each level. At component bench, only the unit under test is real; everything else is test equipment. At subsystem integration, neighboring subsystems may be real or simulated. Document what is simulated and the fidelity of the simulation relative to the real system. Low-fidelity simulations can mask integration problems.
4. Build the verification schedule from the bottom up. Component tests complete before subsystem integration begins. Subsystem tests complete before system integration. System tests complete before operational testing. Include buffer time for anomaly investigation: historically, 20 to 30% of test time is consumed by anomaly resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
