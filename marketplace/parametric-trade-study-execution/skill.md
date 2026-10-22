# Parametric Trade Study Execution

Use SysML parametric diagrams to run quantitative trade studies, linking design parameters to constraint equations and evaluation criteria.

## Inputs

- `allocation-matrix`: Function-to-component allocation
- `trade-study-criteria`: Evaluation criteria with weights for comparing design alternatives

## Outputs

- `trade-study-results`: Scored alternatives with sensitivity analysis showing which parameters drive the decision
- `parametric-model`: Constraint blocks linking design parameters to performance metrics through physics equations

## Process

1. Define constraint blocks for each physics relationship: mass = sum of component masses, power = sum of component power draws, latency = sum along critical path, reliability = product of component reliabilities (series) or 1 - product of unreliabilities (parallel).
2. Create a parametric diagram linking design parameters (component choices, material properties, interface bandwidths) through constraint blocks to evaluation criteria (mass, cost, power, reliability, latency).
3. For each design alternative, set the parameter values and evaluate the constraint network. Record the score per criterion. Apply weights to get an overall score.
4. Run sensitivity analysis: vary each parameter by +/- 10% and record the change in overall score. Parameters with high sensitivity are the design drivers. If the decision changes within the uncertainty range of a high-sensitivity parameter, the decision is not well-supported and requires more data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
