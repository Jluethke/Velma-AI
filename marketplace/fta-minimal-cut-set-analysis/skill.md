# Fta Minimal Cut Set Analysis

Determine minimal cut sets by Boolean reduction and use them to identify single points of failure and critical failure combinations.

## Inputs

- `fault-tree-structure`: The complete fault tree
- `basic-event-list`: All leaf nodes with descriptions

## Outputs

- `minimal-cut-sets`: All minimal cut sets sorted by order (number of events): order-1 (single points of failure), order-2, order-3, etc.
- `single-point-failures`: Every order-1 cut set, which represents a basic event whose failure alone causes the top event
- `critical-combinations`: Order-2 and order-3 cut sets that represent the most likely failure combinations, ranked by estimated probability

## Process

1. Convert the fault tree to a Boolean expression. Each OR gate becomes addition (union). Each AND gate becomes multiplication (intersection). Replace gate outputs with their input expressions, working bottom-up until the top event is expressed entirely in basic events.
2. Apply Boolean reduction rules to simplify: absorption (A + AB = A), idempotent (AA = A), and complementation. The reduced expression is the union of minimal cut sets. Each product term is one minimal cut set.
3. For large trees, use the MOCUS (Method of Obtaining Cut Sets) algorithm: start from the top gate, replace each OR gate by listing inputs as separate rows, replace each AND gate by combining inputs on the same row. Remove non-minimal sets (any set that contains another set as a subset).
4. List all order-1 cut sets first. Each one is a single point of failure that must be eliminated or mitigated. The existence of order-1 cut sets means no amount of redundancy elsewhere prevents the top event. This is the most actionable output of the entire FTA.
5. Rank higher-order cut sets by estimated probability (product of constituent basic event probabilities). This identifies which failure combinations are most credible despite requiring multiple simultaneous failures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
