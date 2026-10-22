# Synthesis And Timing Analysis

Run synthesis and place-and-route, analyze the timing report, and identify the root causes of timing failures for systematic resolution.

## Inputs

- `timing-constraints-file`: SDC constraints applied to the design
- `constraint-coverage-report`: Verification that all paths are constrained

## Outputs

- `timing-report-analysis`: Categorized timing failures: setup violations (logic depth, fanout, routing congestion) and hold violations (short paths, clock skew), with the critical path for each failing endpoint
- `root-cause-classification`: Each failure classified: excessive logic levels (needs pipelining), high fanout (needs replication), long routing (needs floorplanning), clock skew (needs constraint adjustment), or constraint error (needs SDC fix)

## Process

1. Run synthesis with timing-driven optimization. Enable retiming (register balancing) if the tool supports it. Set the effort level to high for the initial analysis. Review the synthesis log for warnings: inferred latches (almost always a bug), unconstrained paths, and clock domain issues.
2. Run place-and-route. Use timing-driven placement. After placement, run an initial timing analysis. If timing is met after placement, route with timing optimization. If timing fails after placement, debug before routing (routing cannot improve a bad placement).
3. Read the timing report. For each failing path: note the slack (negative = failing), the data path delay (logic + routing), the clock path delay (launch to capture), and the setup/hold requirement. The path detail shows each element: flip-flop Tco, LUT delay, routing delay, and flip-flop Tsetup.
4. Classify failures. Logic-depth limited: if the data path has more than 6-8 logic levels, the delay through LUTs exceeds the clock period. Fix: pipeline (insert registers). High-fanout limited: if a signal drives hundreds of flip-flops, the routing delay to reach them all is large. Fix: register replication (the tool can do this automatically with the right directive). Routing-congested: if the routing delay is 2-3x the logic delay, the placer put connected elements too far apart. Fix: floorplanning constraints or reducing utilization.
5. Check hold violations separately. Hold violations are usually fixed by the tool automatically (by adding delay buffers). If they persist, it typically indicates a clock skew issue or a false path that should have been constrained. Hold violations are dangerous because they cause functional failures that are not frequency-dependent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
