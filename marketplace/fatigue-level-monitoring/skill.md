# Fatigue Level Monitoring

Monitor decision fatigue over time by tracking decision quality and energy levels throughout the day.

## Inputs

- `decision-schedule`: When decisions are made
- `elimination-rules`: Rules in place

## Outputs

- `fatigue-tracking-results`: Daily energy and decision quality ratings over a 2-week period
- `system-adjustments`: Adjustments to the rules, schedule, and batching based on what is working and what is not

## Process

1. Rate your energy level at 3 points each day (morning, midday, evening) on a 1-10 scale for 2 weeks.
2. Note when you made decisions you later regretted. Were they during low-energy periods? Were they decisions that should have had a default rule?
3. After 2 weeks, review: did the elimination rules hold? Which rules did you follow consistently and which did you abandon? The abandoned rules may need redesign.
4. Adjust the system: add new rules for decisions you are still making unnecessarily, remove rules that create more friction than they save, and shift the schedule if your peak hours turned out to be different than expected.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
