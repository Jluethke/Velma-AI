# Pcrm Dunbar Tier Assignment

Sort the roster into the four Dunbar tiers so that attention gets allocated by relationship closeness rather than by whoever contacted you most recently. The tier sizes are targets, not hard caps, but large overflows are a signal worth reading.

## Inputs

- `raw-contact-roster`: The de-duplicated list of contacts to tier
- `source-coverage-notes`: Where the roster came from and where gaps remain

## Outputs

- `tiered-roster`: Every contact assigned to one of four tiers: inner 5, close 15, regular 50, acquaintance 150
- `tier-overflow-flags`: Tiers that are far over their target size, with a note on what the overflow means

## Process

1. Assign the inner 5 first: the people you would call in a crisis at 2am. If you have more than 5, you are probably counting people you wish were that close rather than people who are. Keep it honest.
2. Assign the close 15 (minus the inner 5, so about 10 more): people you talk with regularly and would be genuinely sad to lose touch with. Then the regular 50: people you want ongoing contact with. Everyone else who passed the inclusion test lands in the acquaintance 150.
3. Place each person by actual closeness and by how much contact you want, not by how often they happen to reach you. A needy acquaintance who messages daily still belongs in the outer tier.
4. Flag any tier that is far over target. An inner 5 of 12 means the tier has lost its meaning. A regular 50 of 200 means you are trying to actively maintain more relationships than the research says is sustainable, and the cadence step will expose the strain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
