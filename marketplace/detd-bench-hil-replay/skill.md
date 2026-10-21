# Bench Hardware-in-the-Loop Replay

**One-line description:** Replays corpus recordings into the target controller on a bench with an isolated bus, actuators disconnected or replaced by dummy loads behind an independent hardware emergency stop, runs the target in replay mode with the injected tick clock, and compares target outputs to host replay outputs bit for bit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `replay_harness` (object, required): Host harness and its canonical output format.
- `corpus_manifest` (object[], required): Entries to replay.
- `bench_setup` (object, required): Target controller part, flashing method, bench bus interfaces, actuator status (disconnected or dummy load), and the independent hardware emergency stop description.

---

## Outputs

- `hil_replay_report` (object[]): Per entry: target build id, host build id, `cmp` result of canonical outputs, first difference in exact form, and the bench configuration used.

---

## Phase 1: Bench Safety and Isolation

### Entry Criteria
- Work happens on a bench, not in a vehicle on a road. If any actuator is connected, it is on a bench or closed course behind an independent hardware emergency stop that removes actuator power without software involvement.
- The bench bus is physically separate from any vehicle bus.
- Braking and emergency-stop paths on the target are not gated, delayed or blocked by the replay software or by any test mode.

### Actions
1. Inspect and record: each actuator output is disconnected or wired to a dummy load; the emergency stop is a hardware device in the power path; press it once and confirm actuator power drops (meter reading recorded).
2. Confirm the bench bus has no connection to a vehicle: list interfaces (`ip link show`) and physical cabling in the setup record.
3. Confirm the replay mode on the target only replaces the input source and clock; it does not disable any safety monitor or braking path. Read the replay mode code path and cite the file.

### Output
Signed bench safety record in `bench_setup`.

### Quality Gate
- Emergency stop test result recorded with the meter reading.
- The replay mode code citation shows no change to braking or emergency-stop handling.

---

## Phase 2: Flash and Replay

### Entry Criteria
- Safety record complete.

### Actions
1. Build the target image from the same commit and float policy as the host harness build; record both build ids.
2. Flash with the vendor tool named in `bench_setup`; read back the version string from the target to confirm.
3. Feed each recording into the target's replay input: over the isolated bench bus (for CAN, `canplayer` onto the bench interface only, never a vehicle interface) or through a debug or test port the target exposes for replay. The target uses the recorded `now_ns` per tick, not its own timer, for decision inputs.
4. Capture target outputs from its output channel and convert to the canonical format.
5. Record target timing (tick execution time) separately; timing does not enter the comparison but is reported.

### Output
Target canonical outputs per entry.

### Quality Gate
- Each entry has target outputs with the same tick count as the recording.

---

## Phase 3: Compare Target and Host

### Entry Criteria
- Outputs captured.

### Actions
1. `cmp host_out/<id> target_out/<id>` per entry.
2. Classify differences:

| Pattern | Likely cause |
|---|---|
| Last bits of floats after multiply-add | FMA contraction on target compiler; check its flags |
| Values after transcendental calls | Target math library differs from host |
| Missing or shifted ticks | Input delivery dropped frames; check bench bus error counters |
| Differences only under load | Target is not deterministic per tick, or overran a deadline and skipped work |

3. Every difference becomes a defect or an open question; do not accept a tolerance.

### Output
`hil_replay_report`.

### Quality Gate
- Every entry has a `cmp` exit status; every difference has a cause from the table or an open question.

---

## Worked Example

Illustrative only. Bench: target controller on a desk harness, steering motor output on a dummy resistive load, hardware emergency stop in the 12 V actuator feed (meter reads 0.0 V when pressed). 65 entries replayed over isolated `can1`. 63 identical; 2 differ after `atan2` (target uses vendor libm). Open item: link the same math library on target.

---

## Exit Criteria

DONE when bench safety is recorded, every entry replays on the target, and target outputs are identical to host outputs or each difference is classified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No independent hardware emergency stop | **Stop**: do not connect any actuator; replay with actuators disconnected only. |
| Phase 1 | Replay mode alters a braking path | **Stop**: fix the replay mode; braking is never gated by test software. |
| Phase 2 | Bench bus shows error frames | **Retry**: check termination and bitrate on the bench bus, then replay again. |
| Phase 3 | Many differences | **Return**: report the cause table counts and fix the float policy on target first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
