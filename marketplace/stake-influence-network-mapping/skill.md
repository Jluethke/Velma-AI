# Stake Influence Network Mapping

Map who influences whom among the stakeholders, because positions are not held in isolation: many stakeholders take their cue from someone they trust, and moving that trusted influencer can shift several positions at once far more efficiently than persuading each person directly.

## Inputs

- `movement-levers`: The lever that would move each stakeholder
- `lever-evidence`: What each lever requires you to supply

## Outputs

- `influence-network`: The map of who influences whom among the stakeholders, showing whose opinion others follow
- `influencer-ranking`: The stakeholders whose position shifts the most other positions, ranked by reach

## Process

1. Map the influence ties: for each stakeholder, note whose lead they follow, whose opinion they check, and who they defer to. Influence often runs along lines of trust and expertise, not the org chart.
2. Find the high-leverage influencers, the stakeholders whose shift would cascade. A respected skeptic who comes around can bring several fence-sitters with them, which is far cheaper than converting each one directly.
3. Account for the influence the opposed hold. An opponent who influences several neutrals is more dangerous than an isolated one, because they are not just one position against you, they anchor others.
4. Rank stakeholders by influence reach, not just by their own position. This ranking reorders your effort: a neutral with wide influence may deserve more attention than a supporter with none.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
