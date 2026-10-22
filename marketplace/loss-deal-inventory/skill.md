# Loss Deal Inventory

Pull every closed-lost deal from a defined window so the analysis sits on real data, not memory.

## Inputs

- `crm-export`: Export of closed-lost opportunities with dates, amounts, stages, and notes
- `time-window`: The period to study, usually the last two to four quarters

## Outputs

- `lost-deal-list`: Clean list of lost deals inside the window with their key fields
- `loss-metadata`: Per-deal metadata: amount, segment, rep, competitor, and last activity date

## Process

1. Filter the export to opportunities marked closed-lost with a close date inside the time window.
2. Drop duplicates and deals that were never real, such as test records or deals disqualified on day one.
3. For each remaining deal, capture amount, segment, owning rep, named competitor if any, and the date of last meaningful activity.
4. Confirm the count is large enough to see a pattern. Fewer than fifteen losses means widen the window before continuing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
