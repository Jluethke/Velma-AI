# Fault Tree Analysis Execution

Build and analyze fault trees: define the top event, construct the tree, compute cut sets, and assess importance measures.

## Inputs

- `critical-items-list`: Critical failure modes from FMEA
- `system-architecture`: Architecture showing redundancy and fault tolerance features

## Outputs

- `fault-tree-model`: Complete fault tree with top event, intermediate events, basic events, and gate logic
- `cut-set-analysis`: Minimal cut sets ranked by probability, importance measures (Birnbaum, Fussell-Vesely, RAW, RRW) per basic event

## Process

1. Define the top event precisely: 'Loss of system function X during operational phase Y.' Ambiguous top events produce ambiguous trees. The top event must be observable and unambiguous.
2. Decompose top-down using AND/OR gates. An OR gate means any input causes the output (series reliability). An AND gate means all inputs must occur (parallel/redundant). Continue decomposition until reaching basic events (component failures with known rates).
3. Compute minimal cut sets: the smallest combinations of basic events that cause the top event. Single-point cut sets (order 1) are the most critical because one failure causes system failure. Order-2 cut sets require two simultaneous failures.
4. Calculate importance measures: Birnbaum importance = change in top event probability when basic event probability changes from 0 to 1. Fussell-Vesely = fraction of top event probability involving this basic event. Risk Achievement Worth = how much top event probability increases if basic event is certain to fail. Use these to prioritize design improvements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
