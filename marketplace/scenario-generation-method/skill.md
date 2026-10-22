# Scenario Generation Method

Generate test scenarios systematically: cover the operational design domain, create adversarial scenarios, and mine real-world data for edge cases.

## Inputs

- `simulator-design`: Simulator with its capabilities and fidelity
- `validation-objectives`: What to test and acceptance criteria

## Outputs

- `scenario-library`: Structured library of test scenarios with coverage documentation
- `scenario-generation-pipeline`: Automated pipeline for generating new scenarios from data or parametric variation

## Process

1. Define the scenario description framework. Each scenario specifies: initial conditions (ego pose, speed, other actors), environment (road geometry, weather, lighting, traffic signs/signals), actor behaviors over time (trajectories, decision points), and the expected outcome (pass criteria). Use a scenario description language (OpenSCENARIO or similar) for machine-readable specification. Categorize scenarios by type: nominal (common driving situations), edge (rare but plausible), adversarial (designed to exploit known weaknesses).
2. Generate parametric scenario variations. Take each base scenario and vary its parameters: actor speeds, gaps, positions, timing. Use methods: grid search (exhaustive but expensive), Latin hypercube sampling (space-filling with fewer samples), adaptive sampling (focus on the boundary between pass and fail regions). For each scenario type, define the relevant parameter ranges from the operational design domain. Example: for a cut-in scenario, vary the cut-in speed, gap, and lateral rate across their plausible ranges.
3. Mine real-world data for edge cases. From fleet driving data or public datasets, extract scenarios where the system or a human driver encountered difficulty: hard braking events, near-misses, unusual road user behavior, adverse weather encounters. Replay these in simulation to verify the system handles them correctly. Cluster similar events and create representative scenarios. This data-driven approach finds scenarios that parametric variation might miss because they involve combinations of factors not predicted analytically.
4. Generate adversarial scenarios. Use optimization to find the scenario parameters that maximize the system's failure probability. Methods: gradient-based optimization if the simulator is differentiable, evolutionary algorithms for black-box optimization, reinforcement learning to train adversarial agents that provoke failures. Adversarial testing is valuable for finding the system's breaking points, but the scenarios may be unrealistically adversarial. Filter adversarial scenarios for plausibility: only keep scenarios that could actually occur in the operational design domain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
