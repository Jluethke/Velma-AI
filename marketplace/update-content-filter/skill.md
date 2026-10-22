# Update Content Filter

For each audience, include only the information they need to make their decision. Remove everything they can look up themselves. The goal is the shortest update that supports the decision, not the most complete update.

## Inputs

- `audience-decision-map`: What each group decides and when
- `project-or-system-description`: The full set of available information

## Outputs

- `content-spec-per-audience`: For each audience: what to include (delta, blockers, outlook) and what to exclude (available elsewhere, not decision-relevant)
- `self-service-pointer`: For excluded information, where the audience can find it themselves if they want it

## Process

1. For each audience, list every piece of information they currently receive in updates.
2. For each piece, ask: does this change their decision? If no, cut it.
3. For each piece, ask: can they get this from a dashboard, document, or tool themselves? If yes, cut it and point them there.
4. What remains: delta (what changed since last update), blockers (what is stuck and what is needed to unstick it), and outlook (is the trajectory on track, slipping, or improving).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
