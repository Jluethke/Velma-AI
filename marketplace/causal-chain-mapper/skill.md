# Causal Chain Mapper

Map the causal chain backward from the surface point to the root. At each node, ask: what had to be true for this to happen? Keep going until you reach a node that, if changed, would have prevented the entire chain.

## Inputs

- `problem-profile`: The documented recurring problem
- `surface-point`: Where the problem becomes visible

## Outputs

- `causal-chain`: Ordered sequence of causes from root to surface, each linked to the next by a 'this caused that' relationship
- `intervention-candidates`: Nodes in the causal chain where an intervention could break the chain

## Process

1. Start at the surface point. Ask: what was the immediate cause of this symptom? Record it as the first upstream node.
2. For each node, ask again: what had to be true for THIS to happen? Record and link.
3. Stop when you reach a node that is either a design decision, a missing check, a missing skill, or an environmental condition. These are the roots.
4. Mark every node where an intervention is feasible. The further upstream, the more downstream problems it prevents.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
