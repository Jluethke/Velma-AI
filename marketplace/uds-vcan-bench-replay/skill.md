# Virtual CAN Bench Replay

**One-line description:** Creates a `vcan0` virtual CAN interface and replays a captured candump log into it with `canplayer`, so decoders and diagnostic tools are developed and tested at a desk without touching the vehicle bus.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `candump_log` (string, required): Path to a log written by `candump -l`, from `uds-candump-passive-log`.

---

## Outputs

- `vcan_bench` (object): Virtual interface name, the replay command, frame count sent versus frames in the log, and the verification result.

---

## Phase 1: Create vcan0

### Entry Criteria
- A Linux host with root access. No vehicle is needed.

### Actions
1. `sudo modprobe vcan`
2. `sudo ip link add dev vcan0 type vcan`
3. `sudo ip link set up vcan0`
4. Verify: `ip link show vcan0` shows `UP`.
5. Do not set a bitrate on vcan; it has none and `ip link set vcan0 type can bitrate` fails.

### Output
`vcan0` up.

### Quality Gate
- `ip link show vcan0` output contains `state UNKNOWN` or `UP` and the `NOARP` flag.

---

## Phase 2: Replay the Log

### Entry Criteria
- `vcan0` up, `candump_log` file exists.

### Actions
1. Read the interface name recorded inside the log (third field, for example `can0`).
2. Start a capture of the replay in a second terminal: `candump -L vcan0 > replay_check.log`.
3. Replay with interface mapping: `canplayer -I <candump_log> vcan0=can0`. The `dst=src` mapping sends frames recorded on `can0` to `vcan0`. Without it, canplayer tries to send on `can0` (the real bus). Never replay onto the real vehicle interface.
4. Use `-l i` to loop indefinitely when a decoder needs continuous traffic; check `canplayer -h` for the loop flag on your can-utils version.
5. Stop the capture with Ctrl-C after canplayer exits.

### Output
`replay_check.log`.

### Quality Gate
- `wc -l replay_check.log` equals the frame count of `candump_log` minus any error frames (error frames are not replayed).
- The command line contains `vcan0=` and does not name a physical interface as destination.

---

## Phase 3: Point Tools at vcan0

### Entry Criteria
- Phase 2 passed.

### Actions
1. Run every decoder under development against `vcan0` first (for example `uds-isotp-frame-decode` on the replay, or a python-can script with `channel='vcan0'`).
2. For request/response tests, note that a replay has no live ECU: requests sent on vcan0 get no answer. Use the recorded responses as fixtures instead.
3. Record in `vcan_bench` that the bench is replay-only.

### Output
`vcan_bench`.

### Quality Gate
- `vcan_bench.frames_sent` equals `vcan_bench.frames_in_log` (excluding error frames).

---

## Worked Example

Illustrative only.

```
$ sudo modprobe vcan && sudo ip link add dev vcan0 type vcan && sudo ip link set up vcan0
$ canplayer -I candump-2026-10-21_101500.log vcan0=can0
$ wc -l replay_check.log
41872 replay_check.log
```

Frames match, so `vcan_bench.verified` = true.

---

## Exit Criteria

DONE when the captured log replays onto `vcan0` with a frame count that matches the source log.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RTNETLINK answers: File exists` | **Adjust**: vcan0 already exists; just bring it up. |
| Phase 2 | `canplayer` sends to can0 | **Stop**: add the `vcan0=can0` mapping; never replay onto the vehicle. |
| Phase 2 | Frame count mismatch | **Retry**: start the capture before the replay and confirm no other program writes to vcan0. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
