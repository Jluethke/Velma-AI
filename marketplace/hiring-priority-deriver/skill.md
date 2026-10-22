# Hiring Priority Deriver

Derive hiring priorities from the matrix instead of from manager wish lists. The matrix reveals two kinds of hiring needs: gaps (skills with zero competent people, currently handled by workarounds or not handled) and depth (skills with only one competent person that cannot be cross-trained internally because the skill is too specialized). These are the roles to hire for.

## Inputs

- `cross-training-plan`: Which single points of failure can be addressed internally
- `training-priority-sequence`: The cross-training schedule

## Outputs

- `hiring-priorities`: Roles to hire based on matrix gaps and single points that cannot be cross-trained internally, ranked by business impact
- `hire-vs-train-decision`: For each skill gap: whether to address it through hiring (cannot train internally) or cross-training (can train internally), with rationale

## Process

1. List every skill with 0 people at competent or above. These are gaps. The team is either not performing this function or performing it poorly.
2. List every single point of failure where cross-training is not feasible (the skill is too specialized, no one has adjacent skills, or the expert is leaving soon).
3. Combine the gaps and the un-trainable single points. These are the hiring priorities.
4. Rank them by business impact: what is the cost of not having this skill covered? This ranking, not the manager's wish list, should drive headcount decisions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
