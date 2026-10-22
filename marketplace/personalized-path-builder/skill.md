# Personalized Path Builder

Build a recommended starting path: which chain to run first, which to run next, and why that order makes sense for this user.

## Inputs

- `identified-needs`: User's needs tagged to domains
- `matched-domains`: Relevant domains ranked
- `matched-chains`: Specific chains with explanations
- `experience-level`: User's experience level

## Outputs

- `recommended-first-chain`: The single chain to start with, with rationale
- `recommended-path`: Ordered list of 3 to 5 chains to run in sequence, with the connection between each
- `path-rationale`: Explanation of why this order makes sense for this specific user

## Process

1. Pick the single chain that addresses the user's most urgent or foundational need. If two are equally urgent, pick the one with fewer entry inputs (lower barrier to start).
2. From the first chain's related_chains, identify the natural next step. Repeat to build a path of 3 to 5 chains.
3. For experienced users, recommend chains that go deeper. For beginners, recommend chains that build foundations first.
4. Explain the path in plain language: what each chain does, what it produces, and how each output feeds into the next chain.
5. Present the path as a suggestion, not a mandate. Tell the user they can skip, reorder, or explore a different domain at any point.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
