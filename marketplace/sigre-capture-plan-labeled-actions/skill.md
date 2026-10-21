# CAN Capture Plan with Labeled Actions

**One-line description:** Writes a capture plan in which every physical action (pedal, switch, gear, steering at rest, drive segment) is isolated, repeated, separated by rest periods and stamped into an `actions.tsv` marker file on the same host clock as the CAN log.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_scope` (object, required): Output of `sigre-scope-owned-vehicle-readonly`.
- `target_signals` (string[], required): The physical quantities to decode, in plain words (for example "brake pedal pressed", "accelerator pedal position", "vehicle speed", "steering wheel angle", "left turn signal").
- `reference_source` (string, required): Where numeric ground truth comes from: `gps`, `obd2` (passively observed OBD-II responses), `manual` (video of the instrument cluster), or `none` (state signals only).
- `repetitions` (integer, required): How many times each action is repeated in one capture. Chosen by the user.
- `baseline_seconds` (integer, required): Length of the idle baseline segment, chosen by the user.

---

## Outputs

- `capture_plan` (object): Ordered list of segments. Each segment has a label, vehicle state (key off, accessory, ignition on engine off, engine idle, driving), the single variable changed, repetitions, the rest gap, who performs it, the reference used, and the marker command. Also the file naming rule and the marker file format.

---

## Phase 1: Map Signals to Isolated Actions

### Entry Criteria
- `capture_scope.rules` is present and `ownership_confirmed` was true.
- `target_signals` has at least one entry.

### Actions
1. For each target signal, write exactly one action that changes only that signal. Use this table:

| Signal type | Action | Vehicle state |
|---|---|---|
| Two-state switch (brake pedal, door, turn signal, hazard) | Press and release, or open and close | Ignition on, engine off, parked |
| Continuous pedal (accelerator) | Slow press to full travel, slow release | Ignition on, engine off, parked |
| Gear selector | Step through each position, holding each | Engine idle, foot on brake, parking brake on |
| Steering angle | Slow turn lock to lock and back | Engine idle, parked (power steering active) |
| Vehicle speed, wheel speeds, engine speed | Accelerate and decelerate gently on a public road obeying traffic law, or on a private closed lot | Driving, passenger operates the laptop |

2. Never combine two changes in one segment (for example pressing the brake while shifting). Combined actions make correlation ambiguous.
3. Do not plan any action that requires a diagnostic request, a test mode, or sending any frame.

### Output
Action list, one action per target signal.

### Quality Gate
- Every entry in `target_signals` maps to exactly one action.
- No action row changes two signals.

---

## Phase 2: Order Segments and Insert Rests

### Entry Criteria
- Action list exists.

### Actions
1. Put the baseline segment first: ignition on, engine off, nothing touched, for `baseline_seconds`. Add a second baseline at engine idle if any action happens at idle.
2. After every action repetition insert a rest of at least the same duration as the action, with nothing touched, so each action window has a quiet window next to it for comparison.
3. Repeat each action `repetitions` times. Repetition is what separates a real signal from a byte that changed once by coincidence.
4. Put driving segments last, after all parked segments are captured and saved.

### Output
Ordered segment list.

### Quality Gate
- The first segment is labeled `baseline_idle` and has no action.
- Every action segment is followed by a rest segment.
- Each action appears `repetitions` times.

---

## Phase 3: Define the Marker File and Naming

### Entry Criteria
- Ordered segment list exists.

### Actions
1. Define the marker file `actions.tsv` with columns `epoch_seconds<TAB>label`. Labels use the form `<signal>_<start|end>_<n>`, for example `brake_start_1`.
2. Record the marker command for Linux or macOS hosts, typed by the passenger, one Enter per event:
   `while read -r label; do printf '%s\t%s\n' "$(date +%s.%N)" "$label" >> actions.tsv; done`
   On macOS `date` lacks `%N`; use `python3 -c 'import time,sys;[print(f"{time.time():.6f}\t{l.strip()}",flush=True) for l in sys.stdin]' >> actions.tsv` instead.
3. State that the marker host must be the same machine that runs the capture, so both use one clock. If two machines are used, both must be synchronized by NTP and the offset recorded by `chronyc tracking` (Linux) before capture.
4. Define file names: `<yyyymmdd>_<vehicle-short>_<segment-group>.<ext>` and keep raw logs read-only after capture (`chmod a-w`).
5. Attach `reference_source` to the segments that need it (only driving segments for `gps` and `obd2`).

### Output
`capture_plan`.

### Quality Gate
- `capture_plan` includes the marker command text and the `actions.tsv` column definition.
- Every segment has a label, state, action, repetitions and rest gap.
- Driving segments name the passenger as operator.

---

## Worked Example

Illustrative only.

Input: `target_signals` = ["brake pedal pressed", "vehicle speed"], `reference_source` = "gps", `repetitions` = 5, `baseline_seconds` = 120.

- Phase 1: brake = press and release, ignition on, parked; vehicle speed = gentle accelerate and coast, driving.
- Phase 2: `baseline_idle` 120 s, then `brake` x5 each followed by rest, then `drive_speed` x5.
- Phase 3: marker loop typed by passenger; `actions.tsv` looks like:

```
1729500012.402113	brake_start_1
1729500014.988010	brake_end_1
1729500020.117355	brake_start_2
```

---

## Exit Criteria

DONE when every target signal has one isolated, repeated action with rests, a baseline segment comes first, and the marker file format and command are defined on the capture host clock.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A target signal can only change with another (for example engine speed with throttle) | **Adjust**: keep one action, and record the coupled signal in the segment so later correlation tests both. |
| Phase 1 | A signal needs a diagnostic request or test mode to change | **Stop**: drop it from the plan; this domain is passive only. |
| Phase 2 | User wants to drive and operate the laptop alone | **Stop**: require a passenger or a pre-scripted marker; the driver never touches the laptop. |
| Phase 3 | Marker host differs from capture host with no NTP | **Adjust**: run both on the capture host, or synchronize with NTP and record the offset. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
