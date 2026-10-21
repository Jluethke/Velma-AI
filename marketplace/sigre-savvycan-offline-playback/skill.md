# SavvyCAN Offline Playback with DBC Decode

**One-line description:** Loads the DBC and a normalized log into SavvyCAN with no hardware connection, plays the log back internally, and checks that decoded signals in the frame list and graphing window match the cantools offline decode at named timestamps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `dbc_draft` (object, required): Output of `sigre-dbc-entry-write`.

---

## Outputs

- `savvycan_replay_report` (object): SavvyCAN version, screenshot of the empty connection list, the spot-check table (timestamp, signal, SavvyCAN value, cantools value), and pass or fail.

---

## Phase 1: Offline Session with DBC

### Entry Criteria
- The adapter is unplugged, or the connection window lists no connections.

### Actions
1. Open the connection window and remove every connection; save a screenshot of the empty list.
2. Load the DBC through the DBC file manager (File menu, "DBC File Manager" or similar in your build) and confirm the message count it shows equals `len(db.messages)` from cantools.
3. Load the normalized log (File menu, "Load Log File").
4. Enable interpreted frames in the main frame view (the option to show DBC-decoded signals; label varies by version), so each known ID shows signal names and values.

### Output
Offline session with DBC and log loaded.

### Quality Gate
- Empty connection list screenshot saved.
- DBC message count in SavvyCAN equals cantools' count.

---

## Phase 2: Playback and Spot Checks

### Entry Criteria
- Session ready.

### Actions
1. Open the Playback window. With no connection present, playback feeds SavvyCAN's own windows only. Do not open the Custom Frame Sender.
2. Pick five timestamps per scaled signal spread across the drive (start, rising, steady, falling, end) and get the cantools value at each:
   `cantools decode --single-line work/vehicle_re.dbc < norm/FILE.log | grep -F '(1729507120.' | head -3`
3. In SavvyCAN, find the same frames (sort or search by timestamp) and read the interpreted value.
4. Open the graphing window, add the signal from the DBC, and confirm the curve shape matches the `cantools plot` from the validation flow.

### Output
Spot-check table and graph screenshot.

### Quality Gate
- Every spot-check row shows SavvyCAN and cantools values equal to the displayed precision.
- Graph screenshot saved.

---

## Phase 3: Report

### Entry Criteria
- Spot checks done.

### Actions
1. Record the SavvyCAN version from Help > About.
2. Emit `savvycan_replay_report` with the table, screenshots and pass or fail.
3. Close SavvyCAN before reconnecting any hardware so a stale playback cannot be pointed at a new connection.

### Output
`savvycan_replay_report`.

### Quality Gate
- Report includes the version, both screenshots and every spot-check row.

---

## Worked Example

Illustrative only.

| Timestamp | Signal | SavvyCAN | cantools |
|---|---|---|---|
| 1729507001.204500 | VehicleSpeed | 4.16 | 4.1649 |
| 1729507120.551020 | VehicleSpeed | 48.31 | 48.3149 |
| 1729507200.030114 | BrakePedalPressed | 1 | 1 |

All equal to displayed precision; graph matches the cantools plot; pass.

---

## Exit Criteria

DONE when SavvyCAN, with no connection open, decodes the log with the DBC to the same values as cantools at every spot check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | DBC message count differs | **Adjust**: SavvyCAN's DBC parser may reject a line cantools accepts; read its load messages and simplify that line in `sigre-dbc-entry-write`. |
| Phase 1 | Connection cannot be removed | **Stop**: unplug the adapter and restart SavvyCAN. |
| Phase 2 | Values differ beyond display rounding | **Adjust**: check the Motorola start-bit convention SavvyCAN applied for that signal; report the difference rather than editing the DBC to suit one tool. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
