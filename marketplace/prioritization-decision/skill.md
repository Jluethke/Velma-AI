# Prioritization Decision

Use the ICE ranking as input (not law) for the final prioritization decision, considering dependencies and strategic value.

## Inputs

- `ice-ranking`: All features ranked by ICE
- `current-roadmap`: Existing commitments

## Outputs

- `prioritized-roadmap`: The next 1-3 months of features, ordered by priority, with the ICE score and strategic rationale for each
- `deprioritized-list`: Features explicitly deprioritized, with the reason (low ICE, not aligned with strategy, dependency blocked)

## Process

1. Start with the top ICE-ranked features. Check for dependencies: does feature A require feature B to be built first? If so, B moves up even if its ICE score is lower.
2. Check for strategic alignment: does this feature serve the core job-to-be-done? A high-ICE feature that serves a secondary audience may be deprioritized in favor of a slightly lower-ICE feature that strengthens the core product.
3. The ICE score is a tool, not a decree. It prevents emotional or political feature prioritization by providing a data-based starting point. The final decision may deviate, but the deviation must have a stated reason.
4. Communicate the prioritized roadmap and the deprioritized list to the team. Transparency about what is NOT being built is as important as what is.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
