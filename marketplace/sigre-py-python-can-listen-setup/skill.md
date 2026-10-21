# python-can Listen-Only Bus Configuration

**One-line description:** Produces a python-can `can.Bus(...)` configuration for the user's adapter that is documented as listen-only (silent), verifies it receives at the confirmed bitrate, and proves the configuration contains no transmit path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_scope` (object, required): Output of `sigre-scope-owned-vehicle-readonly` with `stack` = python.
- `python_can_interface` (string, required): python-can interface name as listed in the python-can documentation (for example `socketcan`, `kvaser`, `pcan`, `vector`, `gs_usb`, `slcan`).
- `python_can_channel` (string, required): Channel for that interface (for example `can0` for socketcan, `0` for kvaser, `PCAN_USBBUS1` for pcan).

---

## Outputs

- `python_can_config` (object): The keyword arguments for `can.Bus`, the documented listen-only mechanism with its documentation reference, python-can version, confirmed bitrate, and the receive test result.

---

## Phase 1: Install and Detect

### Entry Criteria
- `capture_scope.stack` == "python".
- Adapter plugged into the laptop, not yet connected to the vehicle.

### Actions
1. Create an isolated environment outside any shared folder: `python3 -m venv ~/canre/venv` then activate it (`source ~/canre/venv/bin/activate` on Linux or macOS, `~\canre\venv\Scripts\activate` on Windows).
2. Install: `pip install python-can cantools numpy`. Record versions with `pip show python-can cantools numpy`.
3. Install the vendor driver the python-can interface page names (for example Kvaser CANlib SDK for `kvaser`, PEAK PCAN-Basic for `pcan`).
4. List detectable channels: `python -c "import can; print(can.detect_available_configs())"`. Record the entry for the adapter.

### Output
Environment, versions, detected channel.

### Quality Gate
- `pip show python-can` prints a version.
- `detect_available_configs()` output contains `python_can_interface`, or the vendor tool lists the device.

---

## Phase 2: Pick the Listen-Only Mechanism

### Entry Criteria
- Interface detected.

### Actions
1. Choose with this table. Do not invent keyword arguments; open the python-can interface page for your installed version and confirm the argument name.

| `python_can_interface` | Listen-only mechanism | Proof |
|---|---|---|
| socketcan | Set by the OS: `sudo ip link set can0 type can bitrate <rate> listen-only on`. python-can only opens the interface. | `ip -details link show can0` shows `LISTEN-ONLY` |
| kvaser | `driver_mode` argument documented in the python-can Kvaser interface page as silent or normal; silent is `False` in the versions that document it. | Cite the doc page and version |
| any other | Look up a silent or listen-only argument in the python-can page for that interface. If none is documented, set listen-only with the vendor configuration tool if the vendor documents it. | Cite the page or vendor manual |

2. If no documented mechanism exists for the adapter on this host OS, stop. A receive-only script on a normal-mode adapter still acknowledges frames on the bus.
3. Write the configuration as a dict, for example `{"interface": "socketcan", "channel": "can0"}` or `{"interface": "kvaser", "channel": 0, "bitrate": 500000, "driver_mode": False}`.

### Output
Draft `python_can_config` with mechanism and citation.

### Quality Gate
- The mechanism row and documentation reference are recorded.
- The config dict contains no key that is not named in the cited documentation.

---

## Phase 3: Receive Test

### Entry Criteria
- Draft config exists.

### Actions
1. Save this test as `~/canre/rxtest.py` (outside the marketplace and outside the repository), replacing `CONFIG`:
   ```
   import can
   CONFIG = {"interface": "socketcan", "channel": "can0"}
   with can.Bus(**CONFIG) as bus:
       n = 0
       for msg in bus:
           print(msg)
           n += 1
           if n >= 20:
               break
   ```
2. Confirm the file has no transmit call: `grep -nE "send|send_periodic" ~/canre/rxtest.py` must print nothing.
3. Connect to OBD-II pins 6 and 14, ignition on, engine off, and run `python ~/canre/rxtest.py`.
4. Read the output: lines like `Timestamp: 1729505700.004113  ID: 01a0  S Rx  DL: 8  00 00 3c ...` mean reception works. A hang with no lines means wrong bitrate or no traffic; for socketcan, check error counters as in the Linux setup flow.
5. Emit `python_can_config`.

### Output
`python_can_config`.

### Quality Gate
- The grep in action 2 prints nothing.
- The test printed received frames with the `Rx` marker.

---

## Worked Example

Illustrative only.

Input: `python_can_interface` = "kvaser", `python_can_channel` = "0", Windows 11 laptop.

- Phase 1: python-can version recorded; `detect_available_configs()` returns `[{'interface': 'kvaser', 'channel': 0}]`.
- Phase 2: Kvaser row; config `{"interface": "kvaser", "channel": 0, "bitrate": 500000, "driver_mode": False}` with the python-can Kvaser page cited.
- Phase 3:
```
Timestamp: 1729505700.004113    ID: 000001a0    S Rx                DL:  8    00 00 3c 00 00 00 00 7e
Timestamp: 1729505700.004702    ID: 000002c4    S Rx                DL:  8    0f a0 00 00 00 00 12 34
```

---

## Exit Criteria

DONE when a documented listen-only configuration receives frames at the confirmed bitrate and the test script contains no transmit call.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `CanInterfaceNotImplementedError` or missing DLL | **Adjust**: install the vendor driver named on the python-can interface page and retry. |
| Phase 2 | No documented listen-only option for this adapter on this OS | **Stop**: switch to Linux socketcan with `ip link ... listen-only on`, or a different adapter. |
| Phase 3 | No frames received | **Retry**: try the next candidate bitrate from `capture_scope`; never send a frame to probe. |
| Phase 3 | Grep finds `send` | **Stop**: remove the transmit call before connecting. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
