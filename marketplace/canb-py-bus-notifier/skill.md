# python-can Receiver with Bus, Notifier and Filters

**One-line description:** Writes a python-can receiver that opens a SocketCAN Bus with kernel-side filters, dispatches frames through a Notifier to Listeners, and shuts down cleanly, then proves it receives on a vcan interface.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface to open, for example "can0" or "vcan0".
- `capture_filters` (string[], optional): candump-style filters "ID:MASK"; converted to python-can `can_filters`.
- `project_dir` (string, required): Directory where the receiver module and its test live.

---

## Outputs

- `py_receiver` (object): Path of the receiver module, python-can version, the filter list, and the result of the vcan smoke test.

---

## Phase 1: Install and Pin python-can

### Entry Criteria
- Python 3 virtual environment in `project_dir`.

### Actions
1. `python3 -m pip install python-can` and record the version with `python3 -c "import can; print(can.__version__)"`. This flow uses the 4.x API; the keyword is `interface=`; the old `bustype=` keyword is deprecated.
2. Pin the version in the project's requirements file.

### Output
python-can installed and pinned.

### Quality Gate
- The printed version starts with "4." or the differences for the installed version are checked in the python-can docs and recorded.

---

## Phase 2: Write the Receiver

### Entry Criteria
- python-can installed.

### Actions
1. Create one file, `<project_dir>/can_rx.py`. Edit only this file in this phase.
2. Convert each filter "123:7FF" to `{"can_id": 0x123, "can_mask": 0x7FF, "extended": False}`; use `"extended": True` for 8-digit IDs. With SocketCAN, python-can installs these as kernel filters, so unmatched frames never reach Python.
3. Open the bus with a context manager: `with can.Bus(interface="socketcan", channel=can_netdev, can_filters=filters, fd=True) as bus:`. Set `fd=True` only if the interface has FD enabled.
4. Create listeners: a custom class subclassing `can.Listener` with `on_message_received(self, msg)` and `on_error(self, exc)`; optionally `can.Printer()` for console output.
5. Start dispatch: `notifier = can.Notifier(bus, [listener], timeout=1.0)`. Notifier runs a background thread reading from the bus.
6. Shut down in this order in a `finally` block: `notifier.stop()`, then leave the `with` block so `bus.shutdown()` runs. Skipping `notifier.stop()` leaves the thread reading a closed socket.
7. Message fields to use: `msg.arbitration_id`, `msg.is_extended_id`, `msg.dlc`, `msg.data` (bytearray), `msg.timestamp` (float seconds), `msg.is_fd`, `msg.bitrate_switch`, `msg.is_error_frame`, `msg.channel`.
8. Do NOT call `bus.recv()` in your own loop while a Notifier owns the same bus; two readers race for frames.

### Output
`can_rx.py`.

### Quality Gate
- `python3 -m py_compile <project_dir>/can_rx.py` exits 0.
- The file contains `notifier.stop()` in a `finally` block.

---

## Phase 3: Smoke Test on vcan

### Entry Criteria
- vcan0 up (from `canb-vcan-setup`).

### Actions
1. Run the receiver on vcan0.
2. Send a matching frame: `cansend vcan0 123#0102` and a non-matching one: `cansend vcan0 124#0102`.
3. The listener must print the 0x123 frame and must not print 0x124.
4. Stop with Ctrl+C and check that the process exits within the Notifier timeout without a traceback.

### Output
`py_receiver` with the test result.

### Quality Gate
- Matching frame received, non-matching frame not received (both observed and recorded).
- Process exit code is 0 or 130 (Ctrl+C) with no traceback.

---

## Worked Example

Illustrative. Input: `can_netdev`="vcan0", `capture_filters`=["123:7FF"].

- Phase 1: version "4.4.2" pinned as `python-can==4.4.2`.
- Phase 2: filters `[{"can_id": 0x123, "can_mask": 0x7FF, "extended": False}]`; Notifier with a custom listener.
- Phase 3: output `Timestamp: 1792580000.120000 ID: 123 S Rx DL: 2 01 02 Channel: vcan0` for 0x123; nothing for 0x124.

---

## Exit Criteria

DONE when `can_rx.py` compiles, receives only filtered frames on vcan, and exits cleanly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TypeError` about `bustype` | **Adjust**: use `interface=`. |
| Phase 2 | Unsure whether an API exists | **Stop**: check the python-can docs for the installed version; do not invent methods. |
| Phase 3 | `OSError: [Errno 19] No such device` | **Return**: the interface does not exist; run `canb-vcan-setup`. |
| Phase 3 | Non-matching frame received | **Adjust**: check `extended` and mask values in the filter dicts. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
