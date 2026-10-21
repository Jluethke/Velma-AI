# Timezone Normalizer

Normalize all timestamps to a common timezone and handle clock skew.

## Inputs

- `raw-events`: Events in their native time formats and zones
- `source-catalog`: Information about each source's timezone and clock accuracy

## Outputs

- `normalized-events`: All events with timestamps converted to UTC
- `skew-corrections`: Documented clock skew corrections applied to each source

## Process

1. Identify the timezone of each evidence source
2. Convert all timestamps to UTC with sub-second precision where available
3. Detect and correct clock skew by aligning known correlated events
4. Document all timezone and skew corrections applied

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
