# Pipelining And Optimization

Apply pipelining, retiming, and logic optimization techniques to close timing on failing paths, trading latency for throughput where necessary.

## Inputs

- `timing-report-analysis`: Failing paths identified with delay breakdown
- `root-cause-classification`: Failure causes classified for targeted fixes

## Outputs

- `rtl-modifications`: Specific RTL changes: pipeline registers inserted at optimal points (cutting the longest combinational path), logic restructured to reduce depth, and fanout-limited signals identified for replication
- `timing-improvement-verification`: Timing results after each modification, showing the slack improvement on the targeted paths and verifying no new failures were introduced

## Process

1. Pipeline insertion. Identify the longest combinational path and insert a register at the midpoint. This halves the path delay at the cost of one cycle of latency. For a pipeline with balanced stages: Fmax_pipelined = 1 / max(Tstage_i). The goal is to make all stages roughly equal in delay.
2. Retiming. The synthesis tool can move registers forward or backward through combinational logic without changing the functionality (if the initial state is handled). Enable retiming: the tool automatically rebalances register placement to equalize path delays. This is especially effective for datapath-heavy designs (DSP, filter chains).
3. Logic restructuring. A long chain of additions (a + b + c + d) creates a linear dependency. Restructure as a tree: (a+b) + (c+d) reduces the depth from 3 to 2. Similarly, priority encoders can be restructured as balanced trees. Conditional assignments (if-elsif-elsif chain) create priority logic; if the conditions are mutually exclusive, use a case statement for parallel evaluation.
4. Fanout reduction. For a reset signal that fans out to every register in the design: use a pipeline of reset registers, one per major functional block, each driving a local fanout tree. Alternatively, set max_fanout synthesis directives and let the tool replicate registers.
5. Iterate. After each RTL change: re-synthesize, re-place, re-route, and re-analyze timing. Verify that the targeted path improved and that no new paths failed. The optimization converges when all paths meet timing with positive slack. Record the final Fmax and the worst-case slack.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
