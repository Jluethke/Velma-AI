# SavvyCAN Baseline and Action Capture

**One-line description:** Captures the idle baseline and labeled action segments in SavvyCAN, saves each group to a log format that python-can and can-utils can read, and checks the saved file's header, frame count and marker coverage.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `savvycan_connection` (object, required): Output of `sigre-savvycan-listen-only-connect`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.

---

## Outputs

- `savvycan_logs` (object[]): One entry per segment group: saved file path, the save format chosen in SavvyCAN, the matching `actions.tsv` path, frame count and time range.

---

## Phase 1: Prepare a Clean Frame List

### Entry Criteria
- `savvycan_connection` shows listen-only checked and frames arriving.

### Actions
1. Clear previously received frames with the main window's clear control so each saved file holds one segment group only.
2. Leave the frame list view in its default unfiltered state; filters in the main view can hide frames from the saved file in some builds. Check that no ID is unchecked in the filter list.
3. Start the marker loop from `capture_plan` in a terminal on the same laptop writing `actions.tsv`.

### Output
Empty frame list, marker loop running.

### Quality Gate
- Frame count reads zero (or near zero) just after clearing.
- All IDs in the filter list are checked.

---

## Phase 2: Capture and Save

### Entry Criteria
- Phase 1 complete; vehicle in the first planned state.

### Actions
1. Type `baseline_idle_start`, wait `baseline_seconds`, type `baseline_idle_end`. Perform each action with start and end markers and rests from the plan.
2. After the last end marker, save from the File menu ("Save Log File" in current builds). In the format list, pick by this rule:
   - If "Vector Trace (ASC)" or a candump / Linux log format is listed, choose it (python-can reads `.asc` and candump `.log`).
   - Otherwise choose "GVRET Native CSV" and record that the normalize flow must convert it.
3. Name the file per `capture_plan` naming, then clear the list before the next group.
4. For the driving group, the passenger handles markers and saving.
5. Make saved files read-only.
6. Note how SavvyCAN timestamps the saved file: open the file in a text editor and compare its first timestamp with the first marker. If timestamps are relative to capture start (small numbers) rather than epoch, record the wall-clock time at which the frame list was cleared, from a marker line `clear_<group>` typed at that moment.

### Output
Saved log files.

### Quality Gate
- Each saved file opens in a text editor and its first line is a header or frame line of the chosen format.
- A `clear_<group>` marker exists for any file whose timestamps are not epoch based.

---

## Phase 3: Verify

### Entry Criteria
- Files saved.

### Actions
1. For `.asc` or candump `.log`: `python -c "import can,sys; t=[m.timestamp for m in can.LogReader(sys.argv[1])]; print(len(t), t[0], t[-1])" FILE`.
2. For GVRET CSV: count data lines with `wc -l FILE` (minus one header line) and read the header to record column names.
3. Compare the frame count with SavvyCAN's status bar count at save time.
4. Emit `savvycan_logs`.

### Output
`savvycan_logs`.

### Quality Gate
- File frame count equals the status bar count recorded at save time, or the difference is recorded.
- Format and timestamp base (epoch or relative) are recorded per file.

---

## Worked Example

Illustrative only.

- Phase 2: saved `20261021_parked.asc` as Vector Trace; first lines:
```
date Mon Oct 21 10:15:00 2026
base hex  timestamps absolute
   0.000412 1  1A0             Rx   d 8 00 00 3C 00 00 00 00 7E
```
  Timestamps are relative; marker `clear_parked` at 1729505699.80 recorded.
- Phase 3: LogReader count 241877 equals the status bar count.

---

## Exit Criteria

DONE when every segment group is saved in a recorded format, read-only, with frame counts verified and the timestamp base documented.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Format list lacks ASC and candump | **Adjust**: save GVRET CSV and let `sigre-log-normalize-convert` convert it. |
| Phase 2 | Forgot to clear before a group | **Adjust**: keep the file; record both groups' marker ranges so later steps slice by time. |
| Phase 3 | `can.LogReader` raises on the file | **Adjust**: open it in a text editor, record the format, and pass it to the normalize flow as GVRET-style CSV. |
| Phase 3 | Count mismatch | **Retry**: save again; if it persists, recapture the group. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
