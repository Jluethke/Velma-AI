# Targeted Capture Planning

Design the minimal set of single-action captures needed to close the remaining unclassified signals. Each capture isolates exactly one function while holding everything else constant, producing a clean signal diff.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load remaining unknowns and partial classifications
REASON  --> Group by suspected subsystem, design isolation captures
PLAN    --> Order by expected closure count, estimate total time
ACT     --> Output capture plan with expected resolutions
```

## Inputs

- `unknown_signals`: list[object] -- Remaining unclassified signals
- `event_correlated_signals`: list[object] -- Partially classified signals from event-correlation-analysis

## Outputs

- `capture_plan`: list[object] -- Ordered list of captures. Each: system state before, single action to perform, duration, expected signal diffs, and which unknowns it should resolve.
- `expected_closures`: list[object] -- Per capture: predicted number of unknowns resolved

---

## Execution

### OBSERVE: Group Unknowns

1. Group remaining unknowns by rate tier and byte dynamics. Signals in the same tier that co-vary likely belong to the same subsystem.
2. For partially classified signals, group by suspected subsystem.
3. Count total unknowns to resolve.

### REASON: Design Isolation Captures

1. For each group, design a capture that activates exactly one function:
   - **Baseline:** Record 30 seconds with the system in a known stable state (e.g., engine idling, parked, no inputs)
   - **Action:** Perform exactly one action (press brake, turn wheel, shift gear, toggle lights, activate cruise)
   - **Return:** Return to baseline for 30 seconds
   - **Diff:** Signals that changed during the action but returned to baseline are related to that function

2. Single-action isolation rules:
   - Only one input changes per capture
   - All other inputs are held constant
   - The action is large enough to produce a measurable effect
   - The action is short enough to produce a clean step response

3. Design captures for the most common subsystem gaps:
   - Brake functions: press brake pedal at different pressures
   - Steering functions: turn wheel at standstill and at speed
   - Transmission functions: shift from P to D and back
   - Lighting functions: toggle headlights, turn signals, hazards
   - HVAC functions: change fan speed, temperature setting
   - ADAS functions: activate cruise control, lane keeping (if equipped)

### PLAN: Prioritize

1. Order captures by expected closure count. The capture that resolves the most unknowns goes first.
2. Estimate total time: 90 seconds per capture (30s baseline + 30s action + 30s return) plus transition time between captures.
3. For a typical system with 80 unknowns and 10-15 captures: expect 60-90 minutes of data collection to classify most of the bus.

### ACT: Deliver

1. Output the capture plan as an ordered checklist with exact instructions per capture.
2. Output expected closures: how many unknowns each capture should resolve.
3. Note that some signals may require combined actions (e.g., cruise at speed + braking) which can be captured in a second pass.

## Exit Criteria

1. Every remaining unknown is covered by at least one planned capture
2. Captures are ordered by expected resolution count
3. Total time estimate is computed
4. Instructions are specific enough for a non-expert to execute

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
