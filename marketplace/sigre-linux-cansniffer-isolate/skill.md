# Isolate Changing IDs with cansniffer on a Virtual Bus

**One-line description:** Replays labeled action segments offline into a `vcan0` virtual interface with `canplayer` (physical interface brought down first) and watches `cansniffer -c` to list which arbitration IDs and bytes change during actions and stay still during rests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.

---

## Outputs

- `cansniffer_candidates` (object[]): One row per target action: label, IDs whose bytes highlighted during action windows, the byte positions seen changing, IDs that also changed in rest windows (rejected), and the replay command used.

---

## Phase 1: Offline Replay Setup

### Entry Criteria
- The laptop is disconnected from the vehicle connector, or the physical interface is brought down. This flow never replays onto a vehicle.

### Actions
1. Bring the physical interface down so nothing can reach it: `sudo ip link set can0 down`. Confirm with `ip link show can0` that the state reads `DOWN`.
2. Create the virtual bus: `sudo modprobe vcan`, `sudo ip link add dev vcan0 type vcan`, `sudo ip link set up vcan0`. Confirm `ip link show vcan0` reads `UP`.
3. Slice one action window plus its surrounding rests from `norm/segments.tsv` into `work/brake_1.log` with the same `awk` slice as the baseline flow.
4. Know this pitfall: `canplayer` sends each frame on the interface named inside the log line (here `can0`) unless you give an assignment like `vcan0=can0`. Always pass the assignment. With `can0` down, a missing assignment fails with "Network is down" instead of transmitting, which is why step 1 comes first.

### Output
`vcan0` up, `can0` down, sliced log.

### Quality Gate
- `ip link show can0` output contains `state DOWN`.
- `ip link show vcan0` output contains `UP`.

---

## Phase 2: Replay and Watch

### Entry Criteria
- Phase 1 gates passed.

### Actions
1. Terminal 1: `cansniffer -c vcan0`. `-c` colors changed bytes. Read `cansniffer -?` (or `man cansniffer`) on your system for the timeout (`-t`) and hold (`-h`) options and their default units before changing them; the units are tens of milliseconds in current can-utils.
2. Terminal 2: `canplayer -I work/brake_1.log vcan0=can0`. Add `-v` to print frames as they are sent to `vcan0`.
3. Watch while the replay passes the action timestamps (run `head -1` and compare with `segments.tsv` times; with `-v` you see the timestamps). Write down each ID whose bytes turn colored during the action and go dark in the rest.
4. Replay every repetition of the same action. An ID counts as a candidate only if it highlights in every repetition.
5. Replay a pure rest window. Any ID that highlights there is free running and is rejected for this action (record it).
6. If too many IDs scroll to follow, use cansniffer's interactive commands to hide IDs known as free running from the baseline inventory; check `cansniffer -?` for the exact key syntax on your version.

### Output
Per-action candidate notes.

### Quality Gate
- Each candidate ID is recorded as highlighted in every repetition, with the repetition count written next to it.
- Every rejected ID has a rest window named where it changed.

---

## Phase 3: Record and Tear Down

### Entry Criteria
- All target actions replayed.

### Actions
1. Write `cansniffer_candidates` rows: label, candidate IDs, changed byte positions, rejected IDs, the exact `canplayer` command.
2. Remove the virtual bus if no longer needed: `sudo ip link delete vcan0`.
3. Leave `can0` down until the next capture session needs it; the capture flow re-applies listen-only on bring-up.

### Output
`cansniffer_candidates`.

### Quality Gate
- Every target action in `capture_plan` has a row (possibly with zero candidates, stated explicitly).
- Every row includes the `vcan0=can0` assignment in its recorded command.

---

## Worked Example

Illustrative only.

```
$ sudo ip link set can0 down; ip link show can0 | grep -o 'state [A-Z]*'
state DOWN
$ canplayer -I work/brake_1.log vcan0=can0
```

cansniffer during `brake_1`: rows 0x1A0 (byte 6 and 7 always colored), 0x2C4 byte 0 colored during the press only, 0x3B0 byte 0 colored during the press only. Rest window replay: 0x1A0 still colored, 0x2C4 and 0x3B0 dark.

```
brake: candidates 2C4[b0], 3B0[b0] (5/5 reps); rejected 1A0 (changes in rest_1)
```

---

## Exit Criteria

DONE when every planned action has candidate IDs and bytes confirmed across all repetitions on `vcan0`, rejected free-running IDs recorded, and every replay used an explicit `vcan0=can0` assignment with `can0` down.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `can0` will not go down (in use) | **Stop**: close every program using it; never replay with the physical interface up. |
| Phase 1 | `modprobe vcan` fails | **Adjust**: install the kernel extra modules package for your distribution. |
| Phase 2 | `canplayer` prints "Network is down" | **Adjust**: you omitted `vcan0=can0`; add it. This error is the safety lock working. |
| Phase 2 | Highlight is inconsistent across repetitions | **Adjust**: treat the ID as weak; let `sigre-byte-change-count-diff` decide with counts. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
