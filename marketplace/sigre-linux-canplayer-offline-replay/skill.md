# Offline Replay on vcan with canplayer and Live Decode

**One-line description:** Replays a normalized log onto a virtual `vcan0` bus with `canplayer` (physical interface down), records the replayed stream with `candump -L`, proves the replay is frame-for-frame identical, and decodes the stream with the DBC to confirm streaming decode equals offline decode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `dbc_draft` (object, required): Output of `sigre-dbc-entry-write`.

---

## Outputs

- `canplayer_replay_report` (object): Replay command, frame counts original versus replayed, payload sequence hash comparison, decoded signal counts from the replayed stream versus offline decode, and pass or fail.

---

## Phase 1: Isolate from Hardware

### Entry Criteria
- This is an offline session. The laptop is not connected to the vehicle, or every physical CAN interface is down.

### Actions
1. List CAN interfaces: `ip -br link show type can`. For each physical interface run `sudo ip link set <if> down`.
2. Create `vcan0` if missing: `sudo modprobe vcan; sudo ip link add dev vcan0 type vcan; sudo ip link set up vcan0`.
3. Confirm: `ip -br link show type can` lists every physical interface as `DOWN`, and `ip -br link show vcan0` shows `UP` (vcan interfaces may print state `UNKNOWN` while up; the flags column must include `UP`).
4. Never run `canplayer` without an explicit `vcan0=<original-if>` assignment.

### Output
Hardware isolated, `vcan0` up.

### Quality Gate
- Saved `ip -br link show type can` output shows every physical interface `DOWN`.
- `vcan0` flags include `UP`.

---

## Phase 2: Replay and Record

### Entry Criteria
- Isolation confirmed.

### Actions
1. Terminal 1: `candump -L vcan0 > work/replayed.log`.
2. Terminal 2: `canplayer -I norm/FILE.log vcan0=can0`. `-I` names the input file; the assignment sends frames logged on `can0` to `vcan0`. Leave timing as logged (do not add `-t`, which ignores timestamps), so periodic timing is preserved.
3. When `canplayer` exits, stop `candump` with Ctrl+C.
4. Compare frame payload sequences (timestamps and interface names differ by design):
   ```
   awk '{print $3}' norm/FILE.log | sha256sum
   awk '{print $3}' work/replayed.log | sha256sum
   ```

### Output
`work/replayed.log` and hashes.

### Quality Gate
- `wc -l` is equal for both files.
- Both sha256 sums are identical.

---

## Phase 3: Streaming Decode Check

### Entry Criteria
- Replay identical.

### Actions
1. Offline decode: `cantools decode --single-line work/vehicle_re.dbc < norm/FILE.log | grep -c '::'`.
2. Replayed decode: `cantools decode --single-line work/vehicle_re.dbc < work/replayed.log | grep -c '::'`.
3. Compare signal values: `diff <(cantools decode --single-line work/vehicle_re.dbc < norm/FILE.log | sed 's/^([^)]*) [^ ]* //') <(cantools decode --single-line work/vehicle_re.dbc < work/replayed.log | sed 's/^([^)]*) [^ ]* //')` must print nothing.
4. For a live view during a replay, pipe: `candump vcan0 | cantools decode work/vehicle_re.dbc`.
5. Tear down: `sudo ip link delete vcan0` when done. Leave physical interfaces down; capture flows re-apply listen-only on bring-up.
6. Emit `canplayer_replay_report`.

### Output
`canplayer_replay_report`.

### Quality Gate
- Both decode counts are equal.
- The `diff` prints nothing.

---

## Worked Example

Illustrative only.

```
$ ip -br link show type can
can0             DOWN           
vcan0            UNKNOWN        <NOARP,UP,LOWER_UP>
$ canplayer -I norm/20261021_drive.log vcan0=can0
$ wc -l norm/20261021_drive.log work/replayed.log
  412339 norm/20261021_drive.log
  412339 work/replayed.log
$ awk '{print $3}' norm/20261021_drive.log | sha256sum
9f2c...e1  -
$ awk '{print $3}' work/replayed.log | sha256sum
9f2c...e1  -
```

Decode counts 48035 and 48035, diff empty: pass.

---

## Exit Criteria

DONE when a replay on `vcan0` with physical interfaces down is frame-for-frame identical to the source log and decodes identically with the DBC.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A physical interface cannot be brought down | **Stop**: unplug the adapter; never replay with a physical interface up. |
| Phase 2 | `canplayer` prints "Network is down" | **Adjust**: the assignment is missing or misspelled; fix `vcan0=can0`. |
| Phase 2 | Replayed count lower than source | **Retry**: start `candump` before `canplayer`; check `ip -s link show vcan0` for drops. |
| Phase 3 | Decode diff not empty | **Return**: the logs differ; recheck Phase 2 hashes before blaming the DBC. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
