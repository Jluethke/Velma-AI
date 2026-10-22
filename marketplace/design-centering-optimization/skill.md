# Design Centering Optimization

Adjust design parameters to maximize yield by centering the design within the feasible region of the specification space using statistical optimization techniques.

## Inputs

- `statistical-distributions`: Monte Carlo distributions of performance parameters
- `yield-estimate`: Current yield and yield limiter
- `circuit-schematic`: Sized circuit with adjustable parameters

## Outputs

- `centered-design`: Optimized transistor sizes and bias points for maximum yield
- `improved-yield`: New yield estimate after centering

## Process

1. Identify the adjustable design parameters: transistor W/L ratios, bias currents, compensation values. These are the optimization variables. Each has a physical minimum and maximum.
2. Define the feasible region: the set of design parameters where all specifications are simultaneously met at the typical corner. The Monte Carlo results show the spread around each design point. Yield is maximized when the nominal design point is centered within the feasible region.
3. Use the Simplicial approximation or ellipsoidal methods: compute the distance from the nominal design point to each specification boundary in the parameter space (normalized by the standard deviation in that direction). The design is centered when these distances are equalized.
4. For practical optimization: use an iterative approach. Take the yield-limiting parameter, adjust the design to improve its mean or reduce its variance (increase relevant device sizes), re-run Monte Carlo, check if a different parameter became the new limiter, and repeat.
5. Trade-offs: increasing device sizes for better matching increases area and capacitance (slower). Increasing bias current for wider bandwidth costs power. The optimization finds the Pareto frontier: the minimum area (or power) design that meets the yield target.
6. After centering, re-run the full Monte Carlo to confirm the yield improvement. Compare the yield-limiting parameter before and after. Typical improvements are 5-15% absolute yield increase from design centering alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
