# Attack Vector Mapper

For each threat, enumerate the attack vectors: the specific ways the threat could materialize.

## Inputs

- `threat-catalog`: The threats for each asset
- `asset-inventory`: The assets and their characteristics

## Outputs

- `attack-vector-map`: For each threat: the specific attack vectors (how the threat would materialize), with the preconditions for each vector
- `vector-likelihood-ratings`: Each vector rated for likelihood (1-5) based on the preconditions and the threat actor's capability

## Process

1. For each threat, ask: how would this specific threat materialize? What are the concrete steps from the threat actor's perspective (or the failure sequence for non-intentional threats)?
2. For each vector, identify the preconditions: what must be true for this vector to succeed? (The password must be weak. The door must be unlocked. The backup must not exist. The person must be absent.)
3. Rate the likelihood of each vector succeeding (1-5) based on how many preconditions are currently met. A vector where all preconditions are met is a near-certainty, not a theoretical risk.
4. Group vectors that share preconditions. Fixing one precondition may block multiple vectors at once.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
