# python-OBD Reads over an ELM327 Adapter

**One-line description:** Reads live PIDs and stored DTCs through an ELM327-compatible USB or Bluetooth serial adapter with the `obd` Python package (python-OBD), with protocol auto-detection, null-response handling and the clear command left out of the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diag_scope` (object, required): From `uds-diag-scope-readonly` with `interface` "elm327".
- `elm327_port` (string, required): Serial device, for example `/dev/ttyUSB0`, `/dev/rfcomm0` (Bluetooth) or `COM5` on Windows.

---

## Outputs

- `python_obd_readings` (object): Detected protocol, supported command names, values with units for the requested commands, stored DTCs, and the script path.

---

## Phase 1: Install and Connect

### Entry Criteria
- `diag_scope.read_only` is true.
- Adapter plugged into the OBD-II port, ignition on.

### Actions
1. `python3 -m venv .venv && . .venv/bin/activate && pip install obd` (PyPI name `obd`; source `brendan-w/python-OBD`).
2. On Linux add the user to the serial group (`dialout` on Debian/Ubuntu) and log in again; confirm with `ls -l <elm327_port>`.
3. Turn on debug logging for the first run: `obd.logger.setLevel(obd.logging.DEBUG)`. It prints the AT commands (ATZ reset, ATE0 echo off, ATSP0 automatic protocol) and the protocol found.
4. Connect: `connection = obd.OBD(portstr="<elm327_port>", fast=False, timeout=1.0)` (`fast=False` is slower but more tolerant of clone adapters; check the docs for your version).
5. Check `connection.status()`. It must equal `obd.OBDStatus.CAR_CONNECTED`. `ELM_CONNECTED` means the adapter answered but the vehicle did not.
6. Record `connection.protocol_name()`.

### Output
Open connection.

### Quality Gate
- `connection.status()` printed value is `Car Connected`.

---

## Phase 2: Read Values

### Entry Criteria
- Car connected.

### Actions
1. List supported commands: `for c in connection.supported_commands: print(c.name)`.
2. Query only supported ones: `r = connection.query(obd.commands.RPM)`. Check `r.is_null()` before using `r.value`.
3. `r.value` is a Pint quantity. Use `r.value.magnitude` for the number and `str(r.value.units)` for the unit; convert with `r.value.to("mph")` only when asked.
4. DTCs: `r = connection.query(obd.commands.GET_DTC)`; `r.value` is a list of `(code, description)` tuples.
5. Do NOT call `obd.commands.CLEAR_DTC` in this flow. Clearing is a gated write handled by `uds-clear-dtc-0x14`.
6. For continuous reads use `obd.Async` with `watch()` and a callback; call `connection.stop()` and `connection.close()` on exit.

### Output
Readings.

### Quality Gate
- Every reading row has `is_null` false or is marked null with the command name.
- `grep -n CLEAR_DTC` on the script returns no lines.

---

## Phase 3: Compare with the Kernel Path

### Entry Criteria
- A SocketCAN path also exists (optional).

### Actions
1. If the vehicle was also read with `uds-obd2-pid-scaling`, compare RPM and coolant at the same moment. They must agree within one count of the raw value's scaling step (RPM step 0.25, coolant step 1 degC).
2. ELM327 clones vary; a mismatch after this check points at the adapter, not the vehicle.

### Output
`python_obd_readings`.

### Quality Gate
- The comparison result is recorded, or recorded as not run.

---

## Worked Example

Illustrative only.

```
>>> import obd
>>> c = obd.OBD("/dev/ttyUSB0")
>>> c.status()
'Car Connected'
>>> c.protocol_name()
'ISO 15765-4 (CAN 11/500)'
>>> c.query(obd.commands.COOLANT_TEMP).value
<Quantity(88, 'degree_Celsius')>
>>> c.query(obd.commands.GET_DTC).value
[('P0133', 'O2 Sensor Circuit Slow Response (Bank 1, Sensor 1)')]
```

---

## Exit Criteria

DONE when the connection reaches Car Connected and every requested supported command returns a value or a recorded null, with no clear command in the code.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Permission denied` on the port | **Adjust**: add the user to `dialout` and log in again. |
| Phase 1 | Status `ELM Connected` only | **Retry**: ignition on; then try `fast=False` and a longer `timeout`. |
| Phase 2 | Command not in `supported_commands` | **Return**: do not force it; record unsupported. |
| Phase 2 | Values garbled on a clone adapter | **Adjust**: switch to the SocketCAN path in `uds-socketcan-link-setup`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
