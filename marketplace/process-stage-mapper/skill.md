# Process Stage Mapper

Map every stage of the process from input to output, including handoffs, queues, and wait states between stages.

## Inputs

- `process-name`: Name of the process to audit
- `process-scope`: Start and end boundaries of the process (e.g., from order received to order shipped)

## Outputs

- `stage-map`: Ordered list of stages with descriptions, responsible parties, and connections between them
- `queue-points`: Points in the process where work waits between stages

## Process

1. Walk the process from start to finish. List every stage where work is actively being done, not just the major ones.
2. Between each active stage, note any queue or wait state (inbox, backlog, staging area, approval hold).
3. Record who or what performs each stage and how it connects to the next.
4. Draw the map as a linear sequence with branches if work splits and merges.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
