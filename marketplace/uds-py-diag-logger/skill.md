# Python Read-Only Diagnostic Logger

**One-line description:** Builds a Python logger that polls a fixed set of OBD-II PIDs and UDS DIDs at a user-set interval, snapshots DTCs at start and end, writes timestamped JSON Lines alongside a raw candump log, and refuses any request the read-only guard denies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `request_guard` (object, required): From `uds-readonly-request-guard`.
- `udsoncan_client` (object, optional): From `uds-py-udsoncan-client`. Needed for UDS DIDs.
- `decoded_pids` (object[], optional): From `uds-obd2-pid-scaling`; lists the PIDs with tested formulas.
- `decoded_dtcs` (object[], optional): From `uds-dtc-status-decode`; reuses its decoder.
- `poll_interval_ms` (integer, required): Polling interval chosen by the user. No default is assumed.

---

## Outputs

- `diag_logger` (object): Package path, entry command, config file, output file naming, and the poll list.
- `logger_test_report` (object): Test summary, a 60-second vcan run result, and the guard wire check.

---

## Phase 1: Design the Poll List and Record

### Entry Criteria
- Guard tests passed.

### Actions
1. Poll list = only PIDs in `decoded_pids` with a formula, and DIDs in the udsoncan codec table. Store it in `logger.toml`.
2. One JSON object per line (`.jsonl`): `{"t_mono": ..., "t_wall": "...Z", "ecu": "7E8", "kind": "pid", "id": "0C", "raw": "1AF8", "value": 1726.0, "unit": "rpm"}`. Negative responses are logged with `"nrc"`.
3. Keep the raw hex on every line so the record can be decoded again later.
4. Use `time.monotonic()` for intervals and UTC for wall time.
5. Bus load: count requests per second = (PIDs + DIDs) * 1000 / `poll_interval_ms`. Record it; if requests take longer than the interval (measured in Phase 3), the logger must log the overrun rather than send back-to-back requests.

### Output
`logger.toml` and record schema.

### Quality Gate
- Every poll list entry exists in `decoded_pids` or the codec table.

---

## Phase 2: Implement

### Entry Criteria
- Phase 1 done.

### Actions
1. Create the package `diaglogger/` with `__main__.py`, `poller.py`, `writer.py`. Edit one file at a time; run tests after each.
2. Startup: read DTCs once (`19 02 FF` or OBD 03) and write them. Shutdown (Ctrl-C, SIGTERM): read DTCs again, then flush and close.
3. Loop: for each entry send through the guarded client; on timeout log `"timeout": true` and continue; on `NegativeResponseException` log the NRC.
4. In parallel start `candump -l -e <interface>` (interface name read from `logger.toml`) as a subprocess so the raw bus record exists for every session; stop it on exit.
5. Write the JSONL with `flush()` after each line so a power loss keeps prior data.
6. The logger has no code path for clear, write, routine start or session 0x02. Entry command: `python -m diaglogger --config logger.toml --out logs/`.

### Output
`diag_logger`.

### Quality Gate
- `grep -rnE "clear_dtc|write_data|io_control|start_routine|ecu_reset" diaglogger/` returns no lines.

---

## Phase 3: Test

### Entry Criteria
- Package exists; `vcan0` up.

### Actions
1. Unit tests: record line schema, PID scaling reuse, NRC logging, overrun logging when a fake request takes longer than the interval.
2. Run 60 s against the fake ECU on `vcan0` (from `uds-py-udsoncan-client` tests). Count lines per entry; it must be close to 60000 / `poll_interval_ms` per entry, minus logged overruns.
3. Guard wire check: configure a forbidden DID write in a test config; the logger must refuse to start and `candump vcan0` must show no frame for it.
4. Run `pytest -q`.

### Output
`logger_test_report`.

### Quality Gate
- `pytest -q` prints 0 failed.
- The 60-second run's line count per entry plus overruns equals 60000 / `poll_interval_ms` rounded down, within one line.

---

## Worked Example

Illustrative only. `poll_interval_ms` = 500, poll list PIDs 0C, 05, 0D and DID F190 (once at start).

```
$ python -m diaglogger --config logger.toml --out logs/
logs/2026-10-21T10-50-00Z.jsonl
{"t_mono": 0.503, "ecu": "7E8", "kind": "pid", "id": "0C", "raw": "0BB8", "value": 750.0, "unit": "rpm"}
$ pytest -q
.......                                                 [100%]
7 passed in 61.2s
```

---

## Exit Criteria

DONE when the logger writes decodable JSONL plus a raw candump log, polls only tested PIDs and DIDs through the guard, and passes its tests and the 60-second run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | PID without a tested formula | **Adjust**: log raw only, or add it via `uds-obd2-pid-scaling`. |
| Phase 2 | Overruns every cycle | **Return**: ask the user for a longer `poll_interval_ms` or a shorter list. |
| Phase 3 | Forbidden request reaches vcan0 | **Stop**: the guard is bypassed; fix before vehicle use. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
