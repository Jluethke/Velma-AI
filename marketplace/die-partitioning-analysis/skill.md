# Die Partitioning Analysis

Determine where to split a monolithic die into chiplets based on yield economics, function boundaries, and process node requirements.

## Inputs

- `monolithic-die-spec`: Current or planned monolithic die: block diagram, area per function, transistor count, process node
- `target-yield`: Minimum acceptable die yield and package-level yield targets
- `volume-projection`: Annual volume forecast for cost modeling

## Outputs

- `partition-candidates`: Candidate chiplet partitions with area, function, and process node per chiplet
- `yield-comparison`: Yield and cost comparison: monolithic vs each partition candidate using Poisson defect density model

## Process

1. Calculate monolithic die yield from die area and defect density using Murphy's or Poisson model: Y = e^(-D*A) where D is defect density per cm2 and A is die area.
2. Identify function boundaries where a cut would place different functions on different process nodes (e.g., analog on mature node, digital on leading edge, I/O on trailing node with thick metals).
3. For each candidate partition, calculate individual chiplet yields and composite package yield as the product of all chiplet yields times assembly yield.
4. Estimate cost per good die for each scenario: wafer cost / (dies per wafer * yield) + assembly cost / assembly yield + test cost at each stage.
5. Rank partitions by total cost per good package at target volume. Note which partitions enable reuse of chiplets across product variants.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
