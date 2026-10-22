# Defense Gap Analyzer

Map existing defenses to attack vectors and identify the gaps.

## Inputs

- `attack-vector-map`: The vectors with preconditions
- `vector-likelihood-ratings`: The likelihood ratings

## Outputs

- `defense-map`: For each vector: the existing defense (if any), whether it addresses the preconditions, and its effectiveness rating (1-5)
- `vulnerability-list`: Vectors where the defense is absent, ineffective, or only partially blocks the preconditions, scored by (likelihood times impact)

## Process

1. For each attack vector, identify the existing defense: is there a control, a process, a technology, or a behavior that blocks or detects this vector?
2. Rate the defense effectiveness (1-5): 1 = no defense, 2 = awareness but no control, 3 = partial control (blocks some preconditions but not all), 4 = strong control (blocks most preconditions, detects the rest), 5 = complete control (prevents and detects).
3. The vulnerability score is: vector likelihood times asset impact times (6 minus defense effectiveness). This prioritizes high-likelihood, high-impact vectors with weak defenses.
4. Rank vulnerabilities by score, highest first. These are your priority fixes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
