# Test Environment Builder

Design and specify test environments for each V&V level, including hardware-in-the-loop, software-in-the-loop, and digital twin configurations.

## Inputs

- `test-case-suite`: Test cases requiring specific environments
- `system-architecture`: Architecture showing what can be simulated vs what must be real hardware

## Outputs

- `test-environment-specs`: Per-level environment specifications: hardware, software, simulation models, interfaces, and calibration requirements
- `test-environment-risk-assessment`: Risks from environment fidelity gaps and mitigation through test at higher levels

## Process

1. For each test level, determine the mix of real hardware and simulation. Unit test: all simulation except the unit under test. Integration test: real components at the integration boundary, simulated components elsewhere. System test: all real components, simulated operational environment. Acceptance test: all real.
2. For simulated components, specify fidelity requirements: functional fidelity (produces correct outputs for given inputs), timing fidelity (responds within realistic latency), fault injection capability (can simulate failure modes). Lower fidelity costs less but risks missing integration issues.
3. Design the hardware-in-the-loop (HIL) configuration for integration and system test: real controller hardware, simulated plant, real or simulated sensors/actuators, real communication buses. Specify the real-time simulation platform (dSPACE, NI, Speedgoat) and the plant model fidelity.
4. Assess environment risk: for each test case, what defects could be missed because the environment does not perfectly replicate the operational environment? Mitigate by: testing the high-risk cases at the next level with higher fidelity, or by analysis showing the simulation error is within acceptable bounds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
