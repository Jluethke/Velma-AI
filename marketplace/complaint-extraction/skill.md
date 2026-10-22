# Complaint Extraction

Pull the concrete complaint sentences out of each review and set aside the noise.

## Inputs

- `raw-reviews`: Collected competitor reviews

## Outputs

- `complaint-statements`: The specific complaint sentences extracted from reviews
- `discarded-noise`: Text set aside as vague or off-topic, kept for an audit trail

## Process

1. Read each review and extract the sentences that name a specific problem the buyer hit.
2. Keep the buyer's own words, since their phrasing is the language your market uses.
3. Set aside praise, vague venting, and off-topic remarks as discarded noise.
4. Tag each complaint with the review it came from so frequency counts stay honest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
