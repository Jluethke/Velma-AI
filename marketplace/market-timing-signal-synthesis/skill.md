# Market Timing Signal Synthesis

Combine the three signals into one timing read. The signals can disagree, and the tensions between them are as informative as the signals themselves.

## Inputs

- `demand-signal-strength`: How strong the existing demand looks
- `competitor-entry-count`: How many competitors entered in the last two years
- `technology-readiness`: Whether the needed technology exists and is reliable

## Outputs

- `timing-signal-summary`: The three signals summarized together
- `timing-tensions`: Where the signals disagree and what that implies

## Process

1. Put the three signals side by side: demand, competitor entry, and technology readiness.
2. Note where they agree, which strengthens the read.
3. Note where they disagree, such as strong demand but technology not ready, a classic too-early pattern.
4. Summarize the combined picture without forcing a verdict yet.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
