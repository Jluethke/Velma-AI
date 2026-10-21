# Attack Chain Identification

Identify viable attack chains from the relationship graph.

## Inputs

- `relationship-graph`: Vulnerability relationships
- `candidate-chains`: Preliminary chain candidates

## Outputs

- `viable-chains`: Attack chains with step-by-step exploitation order
- `chain-prerequisites`: Prerequisites and conditions for each chain

## Process

1. Walk the relationship graph to find multi-step paths to high-value targets
2. Validate that each step's output satisfies the next step's prerequisites
3. Rank chains by potential impact and feasibility

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
