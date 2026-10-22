# Contributing Conditions Mapper

Map the conditions that existed before the incident and made it possible. These are the layers of Swiss cheese that were already aligned. The incident did not happen because one thing went wrong; it happened because multiple defenses were already weakened.

## Inputs

- `incident-timeline`: The factual sequence of events
- `proximate-cause`: The immediate cause identified in the timeline

## Outputs

- `condition-map`: List of pre-existing conditions that contributed, organized by category: organizational, procedural, environmental, individual
- `defense-failures`: Safety barriers that should have caught the problem but did not, with the reason each one failed

## Process

1. For the proximate cause, ask: what conditions made this action likely or possible? (time pressure, ambiguous procedure, missing information, fatigue, inadequate training, tool malfunction)
2. For each condition, ask: what organizational or systemic factor created this condition? (understaffing creates time pressure, poor documentation creates ambiguity, long shifts create fatigue)
3. Identify every defense (check, review, alarm, approval, failsafe) that should have caught the problem. For each, determine why it did not work.
4. The conditions and defense failures are the real findings. The proximate cause is just where the chain became visible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
