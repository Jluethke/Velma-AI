# Isolate Changing IDs in SavvyCAN Offline

**One-line description:** Loads a normalized log into SavvyCAN with every hardware connection removed, then uses the Sniffer, Flow View and Frame Info windows to list which IDs and bytes change during labeled actions and stay still in rests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.

---

## Outputs

- `savvycan_candidates` (object[]): One row per target action: label, candidate IDs, changing byte positions, rejected IDs, and the window used to see it (Sniffer, Flow View or Frame Info).

---

## Phase 1: Offline Session

### Entry Criteria
- The adapter is unplugged from the laptop, or the connection window shows no connections.

### Actions
1. Open the connection window and remove every connection. The list must be empty. With no connection, playback cannot reach any bus.
2. Load the normalized log from the File menu ("Load Log File"; choose the candump / Linux log type if asked, or load the `.asc` version if your build does not read candump logs).
3. Confirm the main frame list shows the loaded frame count equal to the normalized count in `capture_logs`.
4. Write the action windows from `norm/segments.tsv` on paper or a text file as offsets from the first frame time, since SavvyCAN often shows times relative to the first frame.

### Output
Log loaded offline; window offsets listed.

### Quality Gate
- Screenshot of the empty connection list saved.
- Loaded frame count equals the normalized count.

---

## Phase 2: Find Changing Bytes

### Entry Criteria
- Offline session ready.

### Actions
1. Open Flow View (in the RE or reverse engineering menu in current builds). Select one candidate-rich ID at a time; it plots each byte against time. Step the playback to each action offset and note bytes that move only inside action windows.
2. Open Frame Info for the same ID. It lists, per byte, the values seen and which bits changed. Bits that change only in action windows are candidates.
3. Open the Sniffer window and run Playback (Playback window, with no connection) over one action window. The Sniffer highlights bytes that change; IDs that never change are dimmed or can be hidden ("notched") with the Sniffer's controls. Check your build's tooltip or documentation for the exact control names.
4. Repeat for every repetition. Keep an ID only if it changes in every repetition and not in rests.

### Output
Candidate notes per action.

### Quality Gate
- Each candidate shows the repetition count where it changed, equal to the planned `repetitions`.
- Each rejected ID names the rest window where it changed.

---

## Phase 3: Record

### Entry Criteria
- All actions reviewed.

### Actions
1. Write `savvycan_candidates` rows with label, IDs, bytes, rejected IDs and the window used.
2. Save screenshots of Flow View for each accepted candidate to `work/savvycan/` (outside the marketplace).
3. Do not reconnect any hardware in this session.

### Output
`savvycan_candidates`.

### Quality Gate
- Every target action has a row, including explicit "no candidate" rows.
- Each accepted candidate has a Flow View screenshot path.

---

## Worked Example

Illustrative only.

- Phase 1: connection list empty; `20261021_parked.log` loaded, 241877 frames.
- Phase 2: Flow View for 0x3B0 shows byte 0 stepping 0x00 to 0x01 exactly at each `brake_n` start offset and back at each end; Frame Info shows only bit 0 of byte 0 changes. 0x1A0 byte 6 ramps continuously in rests too: rejected.
- Phase 3:
```
brake: 3B0 b0 bit0 (5/5), 2C4 b0 (5/5); rejected 1A0; window: Flow View, Frame Info
```

---

## Exit Criteria

DONE when every planned action has candidate IDs and bytes confirmed across repetitions in an offline SavvyCAN session with no connections, with screenshots saved.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A connection cannot be removed | **Stop**: unplug the adapter and restart SavvyCAN before loading logs. |
| Phase 1 | Log type not readable | **Adjust**: convert to `.asc` with `python -m can.logconvert` and load that. |
| Phase 2 | Flow View too dense to read | **Adjust**: work one ID at a time, starting with IDs that were constant in `id_inventory`. |
| Phase 2 | Candidate changes in only some repetitions | **Adjust**: mark as weak and let `sigre-byte-change-count-diff` decide from counts. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
