# Python isotp Library Transport

**One-line description:** Sets up the Python `can-isotp` package (`import isotp`) as the ISO-TP transport, either as a thin wrapper over the Linux kernel socket or as a pure-Python stack over python-can, with the parameters from `isotp_params`, and proves it with a pytest round trip on `vcan0`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isotp_params` (object, required): From `uds-isotp-flow-control-params`.
- `can_interface` (string, required): `can0` on the vehicle, `vcan0` for tests.
- `tx_id` (string, required): Request ID in hex, for example `7E0`.
- `rx_id` (string, required): Response ID in hex, for example `7E8`.

---

## Outputs

- `py_isotp_stack` (object): Chosen backend (kernel socket or pure Python), the package versions, the module path of the transport factory, and the pytest result.

---

## Phase 1: Install and Choose the Backend

### Entry Criteria
- Python 3 with `venv`. Linux host.

### Actions
1. `python3 -m venv .venv && . .venv/bin/activate`
2. `pip install can-isotp python-can` (PyPI package `can-isotp`, imported as `isotp`).
3. `pip show can-isotp python-can` and record both versions. API details below are for can-isotp 2.x and python-can 4.x; on other versions read the docs at can-isotp.readthedocs.io before writing code.
4. Pick the backend:

| Condition | Backend |
|---|---|
| Linux, `lsmod | grep can_isotp` prints a line | `isotp.socket` (kernel does timing; best STmin accuracy) |
| Kernel module unavailable, or Windows adapter | `isotp.NotifierBasedCanStack` over `can.Bus` |

### Output
Venv with recorded versions and backend choice.

### Quality Gate
- `python -c "import isotp, can; print(isotp.__name__, can.__version__)"` prints without error.

---

## Phase 2: Write the Transport Factory

### Entry Criteria
- Phase 1 passed.

### Actions
1. Create `diag/transport.py` with one function `make_transport(channel)` returning an object with `send(bytes)` and `recv(timeout)`.
2. Kernel backend:
   - `s = isotp.socket()`
   - `s.set_opts(txpad=<tx_padding>, rxpad=<tx_padding>)`
   - `s.set_fc_opts(bs=<blocksize>, stmin=<stmin_raw>, wftmax=<wftmax>)`
   - `s.bind(channel, isotp.Address(isotp.AddressingMode.Normal_11bits, txid=0x7E0, rxid=0x7E8))`
   - set options before `bind`; the kernel rejects option changes after bind.
3. Pure-Python backend:
   - `bus = can.Bus(interface="socketcan", channel=channel)` (python-can 4 uses `interface=`, not the removed `bustype=`).
   - `notifier = can.Notifier(bus, [])`
   - `stack = isotp.NotifierBasedCanStack(bus=bus, notifier=notifier, address=addr, params={...})` with params keys from `isotp_params`.
   - `stack.start()` before use, `stack.stop()` then `notifier.stop()` then `bus.shutdown()` on exit.
4. Use 29-bit addressing (`AddressingMode.Normal_29bits`) only when `uds-diag-scope-readonly` recorded 29-bit IDs.
5. Do not hard-code IDs inside the function; pass them from config.

### Output
`diag/transport.py`.

### Quality Gate
- `python -m pyflakes diag/transport.py` (or `ruff check`) reports no undefined names.

---

## Phase 3: Round-Trip Test on vcan0

### Entry Criteria
- `vcan0` exists (`uds-vcan-bench-replay` Phase 1).

### Actions
1. Write `tests/test_transport.py`: create two transports on `vcan0` with swapped IDs (tester 7E0/7E8, fake ECU 7E8/7E0). Send a 20-byte payload from the fake ECU; assert the tester receives exactly those 20 bytes. A 20-byte payload forces FF + CF + FC.
2. Add a test that sends a 3-byte payload and asserts it arrives as one SF.
3. Run `pytest -q tests/test_transport.py`.
4. Do not weaken assertions or add sleeps to get green; a failure means a parameter or ID is wrong.

### Output
`py_isotp_stack` with the pytest summary line.

### Quality Gate
- `pytest -q` prints `2 passed` and 0 failed.

---

## Worked Example

Illustrative only.

```
$ pip show can-isotp | grep Version
Version: 2.0.6
$ pytest -q tests/test_transport.py
..                                                       [100%]
2 passed in 0.41s
```

`py_isotp_stack` = `{"backend": "kernel", "factory": "diag.transport:make_transport", "tests": "2 passed"}`.

---

## Exit Criteria

DONE when the transport factory exists, matches `isotp_params`, and the multi-frame and single-frame round trips pass on `vcan0`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ModuleNotFoundError: isotp` | **Adjust**: install `can-isotp`, not a package named `isotp`. |
| Phase 2 | `OSError` on `set_opts` | **Adjust**: call option setters before `bind`. |
| Phase 2 | `TypeError` on a params key | **Stop**: check the docs for the installed version; do not guess keys. |
| Phase 3 | Multi-frame test times out | **Adjust**: the fake ECU and tester IDs are not swapped; recheck addresses. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
