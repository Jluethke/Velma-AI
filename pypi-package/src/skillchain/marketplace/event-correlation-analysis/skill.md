# Event Correlation Analysis

Correlate unknown signals with discrete system events to identify which signals change only during specific conditions. This narrows each unknown's function to a specific subsystem even without knowing the exact signal name.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Align event labels with signal data
REASON  --> Test each unknown against each event type
PLAN    --> Classify by associated subsystem
ACT     --> Output event-correlated and conditional signals
```

## Inputs

- `unknown_signals`: list[object] -- Remaining unclassified signals after mirror removal
- `bus_captures`: list[file] -- Full capture with timestamps
- `event_labels`: list[object] -- Labeled events with timestamps: key on, engine start, gear change, brake application, steering input, acceleration, etc.

## Outputs

- `event_correlated_signals`: list[object] -- Unknowns that change only during specific events. Each: message ID, event type, change pattern, statistical significance.
- `conditional_signals`: list[object] -- Unknowns that appear or disappear based on system state. Each: message ID, enabling condition, disabling condition.

---

## Execution

### OBSERVE: Align Events and Signals

1. For each labeled event, define a window: 1 second before the event to 5 seconds after.
2. Extract each unknown signal's value inside and outside every event window.
3. For signals that appear/disappear, record the system state at the moment of appearance and disappearance.

### REASON: Test Correlations

1. For each (unknown, event type) pair, test whether the unknown's value distribution is statistically different inside vs outside the event window:
   - Use a two-sample t-test or Mann-Whitney U test
   - Significance threshold: p < 0.01

2. Classify by event type:
   - Changes during braking only: brake-related (pressure sensor, pedal position, ABS status)
   - Changes during steering only: steering-related (angle, torque, assist)
   - Changes during acceleration only: powertrain-related (torque request, throttle, gear)
   - Changes above a speed threshold only: ADAS or stability-related
   - Changes during engine start only: cranking or power management
   - Changes during gear shifts only: transmission-related

3. For conditional signals:
   - Record the state at first appearance (engine running + speed > X + gear in D)
   - Test which condition is the gate by checking if the signal disappears when that condition ends

### PLAN: Subsystem Assignment

1. Assign each event-correlated unknown to a subsystem based on its event profile.
2. Rate the confidence: signals correlated with multiple events of the same type are higher confidence.
3. Signals that correlate with no events remain "opaque" and go to targeted-capture-planning.

### ACT: Deliver

1. Output event-correlated signals sorted by subsystem.
2. Output conditional signals with their gate conditions.
3. Report how many unknowns were narrowed to a subsystem, how many remain opaque.

## Exit Criteria

1. Every remaining unknown is tested against all event types
2. Subsystem assignments are made where evidence supports
3. Opaque signals are counted and forwarded to capture planning

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
