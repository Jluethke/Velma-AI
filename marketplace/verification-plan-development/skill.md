# Verification Plan Development

Create a verification plan that maps every design requirement to specific verification tasks, coverage goals, and pass/fail criteria.

## Inputs

- `design-specification`: Functional specification of the design under test, including all operating modes, interfaces, and error conditions
- `design-rtl`: RTL source code of the design under test

## Outputs

- `verification-plan`: Structured plan listing every feature to verify, the verification method (directed test, constrained random, formal, or hardware test), the coverage metric (functional cover point or assertion), and the pass/fail criterion
- `coverage-model-specification`: List of all functional coverage groups, cover points, cross coverage items, and the target coverage percentage

## Process

1. Extract verifiable features from the design specification. Each feature is a specific behavior: 'the FIFO signals full when the write pointer wraps and equals the read pointer.' Features fall into: normal operation, boundary conditions, error conditions, and configuration options.
2. For each feature, choose the verification method: (a) Directed test: for complex protocol sequences or specific corner cases that constrained random would take too long to hit. (b) Constrained random: for broad coverage of input combinations with automatic coverage tracking. (c) Formal: for safety properties (never overflow, always respond within N cycles) and equivalence checking. (d) Hardware: for timing-dependent behavior that cannot be verified in RTL simulation.
3. Define functional coverage for each feature. A cover point records whether a specific condition has been observed during simulation. Cover groups organize related cover points. Cross coverage captures combinations of cover points that must co-occur. Example: cross coverage of FIFO fill level with read/write enable combinations.
4. Set the target coverage: 100% for all defined cover points (every feature must be exercised). If a cover point cannot be reached in simulation (e.g., a hardware-only condition), mark it as excluded with a documented reason.
5. Define pass/fail criteria: zero assertion failures, zero protocol violations, coverage targets met, and the design output matches the reference model (golden model) for all constrained random tests.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
