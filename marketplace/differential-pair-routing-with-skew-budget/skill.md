# Differential Pair Routing With Skew Budget

Route differential pairs with proper length matching, skew budgets, and spacing rules derived from the coupling coefficients and timing requirements.

## Inputs

- `extracted-impedance`: Verified impedance values from field solver
- `propagation-delay`: Propagation delay per unit length
- `coupling-coefficients`: Coupling data for spacing decisions
- `signal-protocol`: Protocol with its timing and skew requirements

## Outputs

- `routing-constraints`: Complete constraint set: trace width, spacing, length match tolerance, max stub length, via transition rules
- `skew-budget-allocation`: Intra-pair skew budget broken into connector, via, and trace contributions
- `length-matching-report`: Achieved length matching for each differential pair with margin to spec
- `routing-exceptions`: Any rule violations with engineering justification for why they are acceptable

## Process

1. Calculate the intra-pair skew budget from the protocol spec. For example, USB 3.2 allows 5 ps intra-pair skew. Convert to length: skew_length = skew_time / propagation_delay. For 5 ps at 170 ps/inch, that is 29 mils of length difference. That is the total budget across the entire path including connectors and vias.
2. Allocate the skew budget: connectors consume a fixed portion (check the connector datasheet for differential skew), vias consume a fixed portion (simulate or use 1 to 3 ps per via transition as a rule of thumb), and the remainder is the trace routing budget. If the connector and via skew already consume most of the budget, the routing must be nearly perfect.
3. Set pair-to-pair spacing at 3x the trace-to-trace spacing within the pair (minimum) to limit crosstalk. Verify with the coupling coefficients: far-end crosstalk between pairs should be below the protocol's noise budget allocation for crosstalk.
4. Route with serpentine (accordion) length matching. Set the serpentine amplitude and pitch to avoid self-coupling: amplitude should not fold traces closer than 3x trace width, and pitch should be at least 4x the dielectric height to the reference plane. Use the EDA tool's differential pair router with these constraints, then verify the length match report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
