# Decay Rule Calibrator

Calibrate the decay rules that determine how quickly a relationship downgrades when interaction stops, accounting for the fact that different relationship types decay at different rates.

## Inputs

- `upward-transitions`: Signals for relationship advancement
- `downward-transitions`: Absence patterns for each stage

## Outputs

- `decay-schedule`: Per-stage decay timelines with the specific day counts before downgrade
- `decay-modifiers`: Factors that slow or accelerate decay (shared context, mutual connections, seasonal patterns)

## Process

1. Set the base decay window for each stage. A reasonable starting point: acquaintance decays to stranger after 180 days of no contact. Active decays to acquaintance after 90 days. Trusted decays to active after 120 days. Advocate decays to trusted after 150 days. These are defaults to be calibrated.
2. Identify decay modifiers. Shared organizational context slows decay (a former coworker stays 'active' longer than a conference acquaintance). Mutual connections slow decay (if you both still talk to the same people, the relationship has ambient maintenance). Seasonal patterns matter (some relationships are annual, like holiday contacts or conference buddies, and should not decay between cycles).
3. Calibrate against your actual data. Look at relationships that went dormant: how long was the gap before you noticed? That felt gap is your natural decay sensitivity. Set the decay window slightly shorter than that gap so the system alerts you before you would have noticed on your own.
4. Define the recovery window: the period after a relationship enters dormant where reactivation is still straightforward (a simple 'been a while' message). Beyond the recovery window, reactivation requires a re-engagement sequence (covered in the reactivation-triage-system chain).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
