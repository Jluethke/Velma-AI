# Causal Chain Mapping

For each symptom, trace the causal chain backward: what caused this symptom? And what caused that? Continue until you reach a cause you can actually change.

## Inputs

- `symptom-list`: All recurring symptoms with frequency and cost
- `total-firefighting-cost`: Total cost of reactive work

## Outputs

- `causal-chains`: For each symptom, the chain of causes from symptom back to root cause (5 Whys or similar)
- `common-roots`: Root causes that appear in multiple causal chains (these are high-leverage intervention points)

## Process

1. For each symptom, ask 'why does this happen?' and record the answer. Then ask 'why does THAT happen?' and record. Continue 5 times or until you reach a cause you could prevent.
2. Be specific at each level. 'Because the process is bad' is not a cause. 'Because the handoff between team A and team B has no written specification, so each team interprets requirements differently' is a cause.
3. After mapping all chains, look for common roots: causes that appear in the causal chains of multiple symptoms. A root cause that drives 5 symptoms is a higher-leverage intervention point than one that drives 1.
4. Mark each cause in the chain as 'controllable' (you can change it) or 'uncontrollable' (external, cannot change). The intervention point must be the most upstream controllable cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
