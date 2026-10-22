# Tightened Loop Rollout

Roll out the tighter loop and set an explicit target loop time to hold. A loop with no target drifts back toward periodic reviews, so the target and its measurement are part of the design.

## Inputs

- `redesigned-loop`: The tightened loop
- `signal-validity`: Whether the signal is trustworthy
- `false-signal-risks`: Where the signal could mislead

## Outputs

- `rollout-plan`: Steps to put the tighter loop in place
- `target-loop-time`: The loop time the team commits to holding

## Process

1. Sequence the redesign into concrete steps with owners.
2. Set a target loop time and the measurement that tracks it.
3. Build in the smoothing or confirmation steps that keep the fast signal honest.
4. Schedule a check to confirm the loop did not drift back toward periodic review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
