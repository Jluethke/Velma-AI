# Timeline Merger

Merge events from all sources into a single unified timeline.

## Inputs

- `normalized-events`: UTC-normalized events from all sources
- `skew-corrections`: Applied corrections for reference

## Outputs

- `unified-timeline`: Single chronological timeline of all events
- `merge-statistics`: Statistics on event counts by source and time period

## Process

1. Sort all events by normalized timestamp
2. Tag each event with its original source for traceability
3. Remove exact duplicates appearing in multiple sources
4. Compute event density statistics across the timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
