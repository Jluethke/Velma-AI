# Steady State Flowsheet Simulation

Build and converge the steady-state flowsheet model for the process.

## Inputs

- `property-method`: Validated thermodynamic model
- `process-pid`: Process flow diagram with equipment specifications

## Outputs

- `converged-flowsheet`: Steady-state simulation with heat and mass balance
- `equipment-performance`: Performance metrics for each unit operation
- `sensitivity-results`: Key parameter sensitivities for design optimization

## Process

1. Build the flowsheet sequentially: start with the reactor section, then add separation, and finally recycles. Use tear streams for recycle convergence. Set reasonable initial estimates for tear streams to help convergence (use the expected composition, not defaults).
2. Specify equipment models: for reactors, use RSTOIC for known conversion, RGIBBS for equilibrium, or RPLUG/RCSTR with kinetics for design. For columns, start with DSTWU shortcut, then switch to RADFRAC rigorous model. For heat exchangers, use HEATX with design mode.
3. Set design specifications: use calculator blocks and design specs to meet process requirements (e.g., adjust reflux ratio to hit distillate purity, adjust reactor temperature to hit conversion target). Avoid over-specifying: N degrees of freedom require exactly N specifications.
4. Run sensitivity analyses on key design variables: plot product purity vs reflux ratio, conversion vs temperature, energy consumption vs recycle ratio. Identify the optimal operating point and the sensitivity of product quality to each variable.
5. Validate the simulation against known data: if plant data exist, compare predicted and measured flow rates, temperatures, and compositions at key points. If designing a new process, cross-check with manual calculations for the reactor, main separator, and overall energy balance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
