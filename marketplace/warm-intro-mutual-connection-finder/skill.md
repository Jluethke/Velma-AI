# Warm Intro Mutual Connection Finder

Find the people who sit between you and the target, mapping every path you can (shared employers, schools, communities, second-degree connections) so you are choosing from several possible connectors rather than forcing the one obvious path.

## Inputs

- `target-profile`: The precise description of who to reach
- `target-shortlist`: Named individuals who fit, in priority order

## Outputs

- `mutual-connection-map`: For each target, the mutual connections who could introduce you, including multi-hop paths
- `connection-strength-notes`: How strong each potential connector's relationship is with both you and the target

## Process

1. For each named target, list everyone you know who plausibly knows them: shared current or former employers, schools, professional communities, and people whose networks overlap with the target's world.
2. Include second-degree paths where a direct connection does not exist. A two-hop path (you know A, A knows the target) is still far warmer than cold, and sometimes A is more willing than a closer but busier connector.
3. For each potential connector, note the strength of their relationship with you and, separately, with the target. A connector who barely knows the target cannot make a warm introduction no matter how well they know you.
4. Do not filter yet. Map all the paths first. The selection step weighs them, and a path you dismiss early (an old colleague you have not spoken to in a while) sometimes turns out to be the strongest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
