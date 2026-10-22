# Frequency Ranking

Count and rank the themes by how often they appear and how severe each complaint sounds.

## Inputs

- `complaint-themes`: Grouped complaint themes
- `source-coverage`: Coverage by competitor and source

## Outputs

- `ranked-themes`: Themes ordered by a combined frequency and severity score
- `severity-scores`: Per-theme severity rating based on how damaging the complaints are

## Process

1. Count the complaints in each theme and note how many distinct reviews and sources they span.
2. Rate severity by how much the complaint would stop a buyer from renewing or recommending.
3. Combine frequency and severity into one score, and discount themes that come from a single source.
4. Order the themes by the combined score and mark the top five.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
