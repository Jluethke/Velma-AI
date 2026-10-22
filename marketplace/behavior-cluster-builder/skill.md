# Behavior Cluster Builder

Cluster contacts into behavioral segments based on their communication patterns, producing groups that predict how to engage rather than who they are.

## Inputs

- `behavioral-profiles`: Per-contact behavioral attributes
- `signal-confidence`: Confidence levels for each attribute

## Outputs

- `behavioral-segments`: Named segments with defining characteristics (e.g., 'Quick Text Responders,' 'Quarterly Check-In People,' 'Event-Triggered Connectors')
- `segment-sizes`: How many contacts fall into each segment and the distribution of relationship value across segments

## Process

1. Cluster contacts using 3 primary dimensions: response latency (fast/medium/slow/unresponsive), initiation pattern (proactive/reactive/event-triggered), and channel preference (synchronous like phone and video, or asynchronous like email and text). These three dimensions produce the most actionable segments.
2. Name each segment descriptively so the name tells you how to engage. 'Fast Async' = responds quickly on text/email, prefers written communication. 'Quarterly Sync' = responds slowly to written messages but engages deeply on quarterly calls. 'Event Connectors' = goes quiet between events but reaches out before and after conferences or milestones.
3. Validate segments against your experience. Does the segmentation explain past interaction frustrations? If you have been emailing a 'Fast Async' contact instead of texting, or trying to schedule monthly calls with a 'Quarterly Sync,' the segmentation reveals a channel mismatch that was hurting the relationship.
4. Identify outlier contacts who do not fit any segment cleanly. These may have too little data (assign them to 'unknown' and collect more signals) or they may have genuinely unusual patterns (they respond to everything within an hour except topics about money, which they ignore). Outlier patterns are often the most important to capture.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
