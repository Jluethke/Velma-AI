# Transition Signal Mapper

Map the specific signals that indicate a relationship is moving between lifecycle stages, both upward (deepening) and downward (decaying).

## Inputs

- `stage-definitions`: The lifecycle stages and their behavioral indicators
- `stage-indicators`: Observable signals for each stage

## Outputs

- `upward-transitions`: For each adjacent stage pair, the signals that indicate the relationship is moving up
- `downward-transitions`: For each stage, the signals that indicate decay toward dormant or lost

## Process

1. For each stage boundary (stranger to acquaintance, acquaintance to active, etc.), define the minimum trigger event. A transition requires at least one signal from the person (not from you). Your outreach alone does not advance a relationship; their response does.
2. Define downward transitions as absence patterns. Active to dormant is not 'they seem distant' but 'zero initiated contact in X days AND last two of your messages received no response.' Quantify the absence window for each stage. Higher stages get longer windows (a trusted contact going quiet for 60 days is different from an acquaintance going quiet for 60 days).
3. Identify the acceleration signals: events that skip stages. A warm introduction from a mutual trusted contact can move someone from stranger to active in one interaction. A public betrayal can move someone from trusted to lost in one event. Document these stage-skip events.
4. Build a transition matrix: rows are current stage, columns are possible next stages, cells contain the trigger signals. Most cells should be empty (you do not go from stranger to advocate in one step without an acceleration event).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
