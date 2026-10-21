# SavvyCAN Listen-Only Connection

**One-line description:** Opens a SavvyCAN connection to the user's adapter with the listen-only option checked before the bus is enabled, confirms frames arrive at the candidate bitrate, and verifies that no transmit window is active.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_scope` (object, required): Output of `sigre-scope-owned-vehicle-readonly` with `stack` = savvycan.

---

## Outputs

- `savvycan_connection` (object): SavvyCAN version, connection type (GVRET serial, SocketCAN, or other listed type), port or interface, bitrate, listen-only setting with a screenshot path of the connection window, and the frame-rate reading from the main window.

---

## Phase 1: Install and Open the Connection Window

### Entry Criteria
- `capture_scope.stack` == "savvycan".
- Adapter plugged into the laptop and NOT connected to the vehicle.

### Actions
1. Download SavvyCAN from its official GitHub releases page and record the version from Help > About.
2. Open the connection window from the Connection menu (the menu item is named "Open Connection Window" in current builds; if your build differs, use the item that lists and adds connections).
3. Click "Add New Device Connection" and choose the type that matches the adapter: GVRET-protocol serial devices, or SocketCAN through QtSerialBus on Linux. Select the port or interface.
4. Before enabling the bus, find the bus row's listen-only control (a checkbox labeled "Listen Only" in the connection window) and check it. If your build shows no listen-only control for this connection type, stop.
5. For SocketCAN connections, also set listen-only at the OS level with `ip link ... listen-only on` as in the Linux setup flow, because the OS setting governs the controller.

### Output
Configured but not yet bus-connected connection.

### Quality Gate
- A screenshot of the connection window shows "Listen Only" checked for the bus row.
- SavvyCAN version is recorded.

---

## Phase 2: Confirm Reception

### Entry Criteria
- Listen-only checked.

### Actions
1. Set the bus speed to the first candidate bitrate from `capture_scope`, enable the bus, then connect the adapter to OBD-II pins 6 and 14 with ignition on, engine off.
2. Read the main window: the frame list fills and the status bar frame count rises. No frames after several seconds means a wrong bitrate or a silent connector.
3. If no frames, disable the bus, change to the next candidate, enable, and repeat.
4. Confirm no transmit is configured: the Custom Frame Sender and Playback windows are closed, and no "Fuzzing" or "UDS" style window is open. Do not open them on a vehicle connection.
5. Emit `savvycan_connection`.

### Output
`savvycan_connection`.

### Quality Gate
- The frame count in the main window increases at the recorded bitrate.
- No sending window is open (Window list or taskbar shows only the main window and connection window).

---

## Worked Example

Illustrative only.

Input: `capture_scope` with adapter "Macchina M2 running GVRET firmware", candidate bitrates 500000 and 250000.

- Phase 1: SavvyCAN version recorded; GVRET serial connection on `/dev/ttyACM0` (Linux) or `COM5` (Windows); Listen Only checked, screenshot saved as `savvycan_conn.png`.
- Phase 2: 500000 shows frames 0x1A0, 0x2C4, 0x3B0 within a second; status bar count climbing; no send windows open.

---

## Exit Criteria

DONE when SavvyCAN receives frames with the listen-only option shown checked and no sending window is open.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No listen-only control for this connection type | **Stop**: use a GVRET device or SocketCAN with OS listen-only, or switch to the linux stack. |
| Phase 1 | Serial port not listed | **Adjust**: install the device's USB serial driver; on Linux add the user to the `dialout` group and log in again. |
| Phase 2 | No frames at any candidate bitrate | **Stop**: check pins 6/14 and grounds; do not use any sending window to probe. |
| Phase 2 | A sending window opened by mistake | **Return**: close it, disconnect the bus, and restart Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
