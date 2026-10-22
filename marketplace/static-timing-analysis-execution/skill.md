# Static Timing Analysis Execution

Run static timing analysis across all relevant operating conditions (corners) and interpret the results to identify failing paths and their root causes.

## Inputs

- `constraint-file`: Complete SDC/XDC constraint file
- `constraint-coverage-report`: Constraint coverage verification results

## Outputs

- `timing-summary`: Worst negative slack (WNS), total negative slack (TNS), and worst hold slack for every clock domain and inter-clock path
- `critical-path-list`: Top 20 failing or near-failing paths with full breakdown: launch clock, capture clock, data path delay, clock path delay, clock uncertainty, required time, arrival time, slack

## Process

1. Run STA at the slow corner (high temperature, low voltage, worst-case process) for setup analysis. This is the binding constraint for maximum operating frequency.
2. Run STA at the fast corner (low temperature, high voltage, best-case process) for hold analysis. Hold violations cannot be fixed by slowing the clock; they must be structurally resolved.
3. For each failing path, decompose the slack: slack = required_time - arrival_time. Required time = capture_edge + Tsu - clock_uncertainty. Arrival time = launch_edge + Tclk_launch + Tlogic + Trouting. Identify whether the failure is logic-dominated (too many LUT levels) or routing-dominated (long physical distance).
4. Check clock uncertainty contributions: PLL jitter, duty cycle distortion, clock network skew. If uncertainty consumes more than 15% of the clock period, investigate PLL settings or clock tree structure.
5. Identify paths crossing clock domains. If they are not covered by false_path or set_max_delay constraints, they represent metastability risks. Flag them for CDC analysis.
6. Generate a ranked list of all paths with negative slack, sorted by slack magnitude. Include the datapath breakdown (each cell delay and routing delay in the chain) so optimization targets are visible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
