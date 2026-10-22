# Warm Intro Chain Tracker

Track every introduction through its stages (asked, forwarded, target responded, meeting held, outcome) so that nothing stalls silently, you know when to nudge gently, and you can later see which connectors and framings actually produce results.

## Inputs

- `mutual-benefit-statement`: What target and connector each gain
- `referrer-risk-reducers`: The reputation-risk reducers built into the ask

## Outputs

- `intro-tracking-log`: A log of each introduction: target, connector, date asked, current stage, and outcome
- `intro-status-states`: The defined stages an introduction moves through and the action due at each

## Process

1. Define the stages: asked the connector, connector forwarded, target responded, meeting held, outcome reached. Each introduction sits in exactly one stage so you always know what is next.
2. Log every introduction against these stages with dates. The dates tell you when something has stalled (a connector who has not forwarded after a week, a target who has not replied after two).
3. Set the action due at each stage. After asking, the ball is with the connector, so wait. After forwarding with no target response, a single gentle nudge to the connector is appropriate, never repeated pressure.
4. Record outcomes even for the ones that die, because the pattern across many introductions is what later tells you which connectors convert and which framings land, and which targets were never a real fit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
