# python-udsoncan Read-Only Client

**One-line description:** Builds a python-udsoncan `Client` on top of the ISO-TP transport with explicit timing config, DID codecs for the identification DIDs, and the read-only request guard wrapped around the connection, then tests it against a scripted fake ECU on `vcan0`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_isotp_stack` (object, required): From `uds-py-isotp-library`.
- `request_guard` (object, required): From `uds-readonly-request-guard`.
- `did_list` (string[], required): DIDs the client must decode, for example `F190`, `F187`, `F18C`.

---

## Outputs

- `udsoncan_client` (object): Module path of the client factory, udsoncan version, config dict, codec table, and the pytest summary.

---

## Phase 1: Install and Connect

### Entry Criteria
- `py_isotp_stack.tests` passed.

### Actions
1. `pip install udsoncan` and record `pip show udsoncan`. The examples follow udsoncan 1.2x; on another version read udsoncan.readthedocs.io before writing code.
2. Connection over the kernel socket:
   - `from udsoncan.connections import IsoTPSocketConnection`
   - `addr = isotp.Address(isotp.AddressingMode.Normal_11bits, txid=0x7E0, rxid=0x7E8)`
   - `conn = IsoTPSocketConnection("can0", addr)` (older releases took `rxid=` and `txid=` keywords instead of an Address; check your version).
   - Pure-Python transport instead: `from udsoncan.connections import PythonIsoTpConnection; conn = PythonIsoTpConnection(stack)` with the stack from `uds-py-isotp-library`.
3. Wrap the connection so its `send` calls the guard's `check()` first. Subclass the connection class and override `specific_send` only after confirming that method name in your installed version's source.

### Output
Guarded connection.

### Quality Gate
- `python -c "import udsoncan; print(udsoncan.__version__)"` prints a version (if the attribute is missing, use `pip show`).

---

## Phase 2: Configure the Client

### Entry Criteria
- Connection built.

### Actions
1. `import udsoncan.configs; config = dict(udsoncan.configs.default_client_config)`
2. Set:
   - `config["data_identifiers"] = {0xF190: udsoncan.AsciiCodec(17), 0xF18C: udsoncan.AsciiCodec(<len from OEM doc>), ...}`. A length must come from the OEM document or from a raw read; never guess.
   - `config["p2_timeout"]` and `config["p2_star_timeout"]` in seconds, from `p2_timing` in `uds-session-control-0x10`.
   - `config["request_timeout"]` as an overall cap, user input.
   - Keep `config["exception_on_negative_response"] = True` so NRCs raise `NegativeResponseException`.
3. `client = Client(conn, config=config)`; use it as a context manager: `with Client(conn, config=config) as client:`.
4. Allowed calls: `client.change_session(DiagnosticSessionControl.Session.extendedDiagnosticSession)` or `defaultSession`, `client.tester_present()`, `client.read_data_by_identifier([0xF190])`, `client.get_dtc_by_status_mask(0xFF)`, `client.get_number_of_dtc_by_status_mask(0xFF)`.
5. Not used in this flow: `unlock_security_access`, `write_data_by_identifier`, `io_control`, `request_download`, `transfer_data`, `ecu_reset`, `communication_control`, `control_dtc_setting`. The guard blocks them anyway.
6. Read results: `resp = client.read_data_by_identifier([0xF190]); vin = resp.service_data.values[0xF190]`. DTCs: `resp.service_data.dtcs`, each `dtc.id` (int), `dtc.status.confirmed`, `dtc.status.test_failed`.

### Output
`diag/uds_client.py` with `make_client(channel)`.

### Quality Gate
- `grep -nE "unlock_security_access|write_data_by_identifier|io_control|request_download|ecu_reset" diag/uds_client.py` returns no lines.

---

## Phase 3: Test Against a Fake ECU

### Entry Criteria
- `vcan0` up.

### Actions
1. Write a fake ECU in the test: an `isotp.socket` bound to `vcan0` with tx 0x7E8 / rx 0x7E0 that answers `22 F1 90` with `62 F1 90` + 17 ASCII bytes, `10 03` with `50 03 00 32 01 F4`, and `19 02 FF` with `59 02 7F 01 33 00 2F`.
2. Tests: VIN decodes to the 17 characters; session change succeeds; one DTC with id 0x013300 and `status.confirmed` true; a call to `client.ecu_reset(1)` raises the guard's error and the fake ECU receives nothing.
3. Run `pytest -q tests/test_uds_client.py`.

### Output
`udsoncan_client`.

### Quality Gate
- `pytest -q` prints 4 passed, 0 failed.

---

## Worked Example

Illustrative only.

```
>>> with make_client("vcan0") as c:
...     print(c.read_data_by_identifier([0xF190]).service_data.values[0xF190])
1G14AK52875123456
$ pytest -q tests/test_uds_client.py
....                                                    [100%]
4 passed in 0.62s
```

---

## Exit Criteria

DONE when the client reads DIDs and DTCs through the guarded connection, uses timing from the ECU, and the fake-ECU tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TypeError` creating `IsoTPSocketConnection` | **Adjust**: signature differs by version; read the installed docs. |
| Phase 2 | `ConfigError` for a DID | **Adjust**: add the codec for that DID to `data_identifiers`. |
| Phase 3 | `TimeoutException` | **Adjust**: fake ECU IDs not swapped or not started before the client. |
| Phase 3 | `NegativeResponseException` | **Return**: decode with `uds-nrc-decode`; do not catch and ignore it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
