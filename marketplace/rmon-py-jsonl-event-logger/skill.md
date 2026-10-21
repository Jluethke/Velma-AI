# Python JSON Lines Event Logger

**One-line description:** Implements the monitor event logger in Python with the standard `logging` module and a `RotatingFileHandler`, writes one JSON object per line that validates against the monitor log schema, flushes and fsyncs on trip records, and never lets logging delay the trip action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `monitor_log_schema` (object, required): Output of `rmon-monitor-log-schema` (schema file path and logging rules).
- `repo_dir` (string, required): Monitor repository root.

---

## Outputs

- `py_event_logger` (object): Module path (`monitor/event_log.py`), test path, a sample log file path, and the validation summary.

---

## Phase 1: Implement the Logger

### Entry Criteria
- `monitor_event.schema.json` exists in `repo_dir`.
- Rotation size and backup count are known (user inputs or requirements). Do not pick them.

### Actions
1. Create ONE file `monitor/event_log.py`:
   ```python
   import json, logging, os, time, datetime
   from logging.handlers import RotatingFileHandler

   ALWAYS_FLUSH = {"trip", "clear", "state_change", "self_fault", "startup"}

   class EventLog:
       def __init__(self, path, max_bytes, backup_count, monitor_id, config_hash, version):
           self.h = RotatingFileHandler(path, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8")
           self.h.setFormatter(logging.Formatter("%(message)s"))
           self.log = logging.getLogger("monitor.events")
           self.log.propagate = False
           self.log.setLevel(logging.INFO)
           self.log.addHandler(self.h)
           self.seq = 0
           self.base = {"monitor_id": monitor_id, "config_hash": config_hash, "monitor_version": version}

       def emit(self, **fields):
           self.seq += 1
           rec = {"t_mono_ns": time.monotonic_ns(),
                  "t_wall_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  "seq": self.seq, **self.base, **fields}
           self.log.info(json.dumps(rec, separators=(",", ":"), allow_nan=False))
           if fields.get("event") in ALWAYS_FLUSH:
               self.h.flush()
               os.fsync(self.h.stream.fileno())
   ```
2. `allow_nan=False` makes `json.dumps` raise on NaN. Catch that in the caller, replace the bad input value with the string `"nan"` in a separate `raw_inputs` field only if the schema allows it; otherwise log `verdict: invalid_input` without the value.
3. Call order in the monitor: switch state and request the safe state first, then call `emit`. Write this as a comment at the call site.
4. For ROS 2 or other high-rate use, a `QueueHandler` plus `QueueListener` moves file I/O off the monitor thread; trip records still flush in the listener.

### Output
`monitor/event_log.py`.

### Quality Gate
- `python -c "import monitor.event_log"` exits 0.
- `rg -n "allow_nan=False" monitor/event_log.py` returns one line.

---

## Phase 2: Validate Output Against the Schema

### Entry Criteria
- Logger imports.

### Actions
1. Write `tests/test_event_log.py` that creates an `EventLog` in `tmp_path`, emits one `eval` and one `trip` record with all required fields, then reads the file and validates each line with `jsonschema.Draft202012Validator(schema).validate(json.loads(line))`.
2. Add a test that `seq` increases by 1 per line and `t_mono_ns` never decreases.
3. Add a test that emitting a record with a NaN input raises `ValueError` from `json.dumps`.
4. Run `python -m pytest tests/test_event_log.py -q`.

### Output
`py_event_logger`.

### Quality Gate
- pytest exits 0.
- The produced sample file validates line by line with zero errors.

---

## Worked Example

Illustrative only.
```
$ python -m pytest tests/test_event_log.py -q
...                                                            [100%]
3 passed in 0.12s
$ head -c 300 /tmp/pytest-of-dev/pytest-7/test_roundtrip0/events.jsonl
{"t_mono_ns":5512093341,"t_wall_utc":"2026-03-04T15:02:11.204512+00:00","seq":1,"monitor_id":"speed-mon-1",...
```

---

## Exit Criteria

DONE when the logger writes schema-valid JSON Lines, flushes and fsyncs on trip-class records, rejects NaN, and is called only after the trip action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rotation size not specified | **Stop**: request it; logs that rotate away trip evidence are a defect. |
| Phase 2 | Schema rejects `additionalProperties` | **Adjust**: remove the extra field from `emit` or add it to the schema through `rmon-monitor-log-schema`. |
| Phase 2 | `os.fsync` slow on the target disk | **Adjust**: move logging to a `QueueListener` thread; keep fsync on trip records. |

**Do not:** log with `print`, use `time.time()` for `t_mono_ns`, or log before acting on a trip.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
