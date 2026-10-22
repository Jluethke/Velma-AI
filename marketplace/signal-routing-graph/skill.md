# Signal Routing Graph

Map the communication graph between all controllers on a shared bus by determining which controller reads which signals and what downstream effect that reading produces. Output a directed graph, dependency chains showing propagation paths, and a redundancy map identifying mirror signals.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load all controllers' transmit inventories and captures
REASON  --> Cross-correlate output signals between controller pairs
PLAN    --> Build directed graph, trace dependency chains, flag redundancy
ACT     --> Output routing graph, dependency chains, redundancy map
```

## Inputs

- `transmit_inventories`: list[object] -- Transmit inventory for every controller on the bus (from io-observation-inventory)
- `bus_captures`: list[file] -- Full bus traffic for time-series correlation
- `signal_database`: object -- Signal definitions for decoding

## Outputs

- `routing_graph`: object -- Directed graph: source controller -> message ID -> receiving controller -> resulting action
- `dependency_chains`: list[object] -- Signal chains showing how a change in one controller propagates through the system, with cumulative latency
- `redundancy_map`: list[object] -- Signals carried on multiple messages, identifying primary (highest rate, lowest jitter) vs mirror copies

---

## Execution

### OBSERVE: Build Cross-Controller Signal Matrix

1. For each pair of controllers (A, B), extract A's transmitted signals and B's transmitted signals as aligned time-series.
2. Compute pairwise Pearson cross-correlation with time lag for every (signal_A, signal_B) combination.
3. Record only pairs where |r| > 0.70 and the lag is consistently positive (A leads B, meaning B reads A's message).

### REASON: Determine Reading Relationships

1. A correlation with consistent positive lag means B reads A's output and uses it in computing B's output. The lag is the processing latency.
2. For each confirmed reading relationship, determine what B does with the data:
   - Direct pass-through (B retransmits the value, possibly at a different rate or resolution)
   - Computation input (B uses the value in a formula; the output signal has a different shape)
   - Threshold gate (B's output changes state when A's signal crosses a threshold)
3. Assign edge labels: source signal, destination signal, relationship type, lag, correlation strength.

### PLAN: Assemble the Graph

1. **Build the directed graph.** Nodes = controllers. Edges = reading relationships. Each edge: source message ID, source signal, destination controller, destination signal, relationship type, lag.
2. **Trace dependency chains.** If A->B and B->C, then A->B->C is a dependency chain. Cumulative latency = sum of individual lags. The longest chain defines the system's end-to-end response time for that signal.
3. **Build the redundancy map.** Find signals carried on multiple message IDs (r > 0.90 between two signals from the same physical quantity). The primary is the one with higher rate and lower jitter. Mirrors confirm the signal but add latency.

### ACT: Deliver

1. Format the routing graph as a table:
   ```
   Source     | Message | Signal       | Reader     | Uses For              | Lag
   PCM        | 0x108   | ENGINE_RPM   | ABS/ESP    | Traction control      | 8 ms
   PCM        | 0x108   | ENGINE_RPM   | TCM        | Shift point calc      | 12 ms
   ABS/ESP    | 0x158   | WHEEL_SPEED  | EPS        | Speed-dependent assist | 6 ms
   ```
2. Format dependency chains with cumulative latency.
3. Format redundancy map: primary signal vs mirrors with rate and jitter comparison.

## Exit Criteria

1. Every controller pair with a reading relationship is mapped
2. Dependency chains are traced with cumulative latency
3. Redundant signals are identified with primary/mirror designation

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Single controller only | No inter-controller routing possible; note and exit |
| REASON | All correlations below threshold | Controllers may be independent, or captures lack sufficient variation |
| PLAN | Circular dependency detected | Valid for feedback loops; annotate as bidirectional relationship |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
