# Crystal Imaging Scorer

Image crystallization plates on schedule and score each drop for crystal hits.

## Inputs

- `screen-plates`: Crystallization plates to inspect
- `setup-log`: Setup date and imaging schedule

## Outputs

- `imaging-log`: Time-course images of each well
- `hit-list`: Conditions scored as hits, with crystal morphology and size notes

## Process

1. Image plates at scheduled intervals (day 1, 3, 7, 14, 30)
2. Score each drop using a standard scale (clear, precipitate, microcrystals, single crystals)
3. Photograph promising hits at higher magnification
4. Compile the hit list with condition details and crystal descriptions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
