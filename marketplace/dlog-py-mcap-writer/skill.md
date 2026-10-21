# Python MCAP Writer with Rotation

**One-line description:** Writes vehicle data to MCAP from Python using the `mcap` package (`mcap.writer.Writer`), with acquisition callbacks that only enqueue, one writer thread that drains a bounded queue, a drop counter when the queue is full, and time-based file rotation from the storage budget.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_format_decision` (object, required): From `dlog-format-select`; message encoding and compression per channel.
- `storage_budget` (object, required): From `dlog-storage-budget`; split duration.

---

## Outputs

- `writer_config` (object): Module path of the writer, package versions (`pip show mcap`), compression and chunk size used, queue capacity, rotation duration, and the test results (written count, dropped count, `mcap doctor` result).

---

## Phase 1: Write the Writer Module

### Entry Criteria
- `pip install mcap` succeeded in the project environment; record the version.
- The source of messages (driver callback, socket loop) exists and runs.

### Actions
1. Create one module, for example `logger/mcap_sink.py`. Edit only this file and its test in this phase.
2. Use only these documented calls:
   ```python
   from mcap.writer import Writer, CompressionType
   w = Writer(stream, chunk_size=<bytes>, compression=CompressionType.ZSTD)  # or LZ4 / NONE
   w.start(profile="", library="my-logger")
   sid = w.register_schema(name="my.Imu", encoding="jsonschema", data=schema_bytes)
   cid = w.register_channel(topic="/imu", message_encoding="json", schema_id=sid)
   w.add_message(channel_id=cid, log_time=t_ns, publish_time=t_pub_ns, data=payload, sequence=seq)
   w.finish()
   ```
   Check `help(Writer)` for the installed version; if a parameter name differs, use the installed one.
3. Timestamps are integer nanoseconds. Use `time.time_ns()` for `log_time` (system realtime, per `dlog-clock-domain-map`); never `time.time() * 1e9`, which loses precision in float.
4. Acquisition callbacks put `(channel, log_time, publish_time, bytes)` into `queue.Queue(maxsize=<capacity>)` with `put_nowait`. On `queue.Full`, increment a per-channel drop counter. Never block a sensor callback on disk I/O.
5. One writer thread calls `get()` and `add_message`. It increments `sequence` per channel so gaps are detectable later.
6. Open files as `open(path, "wb")` in the drive directory; write to `<name>.mcap.active` and rename to `<name>.mcap` after `finish()` so incomplete files are obvious.

### Output
`mcap_sink.py`.

### Quality Gate
- `grep -n "time.time()" logger/mcap_sink.py` returns no lines that feed `log_time`.
- The callback path contains no call to `add_message` or file I/O.

---

## Phase 2: Rotation and Shutdown

### Entry Criteria
- Writer module exists.

### Actions
1. In the writer thread, when `log_time - file_start_ns >= split_duration_s * 1_000_000_000`, call `finish()`, close the stream, rename the file, open the next one, and re-register schemas and channels (each MCAP file is self-contained).
2. Handle SIGINT and SIGTERM by setting a stop flag; the writer thread drains the queue, calls `finish()`, closes and renames. Test both signals.
3. Write per-channel drop counters into the file before `finish()` using `w.add_metadata(name="logger_stats", data={"dropped_imu": "0", ...})`; metadata values are strings.

### Output
Rotating writer with clean shutdown.

### Quality Gate
- Killing the process with SIGTERM leaves no `.mcap.active` file and `mcap doctor` passes on the last file.

---

## Phase 3: Load Test

### Entry Criteria
- Rotation implemented.

### Actions
1. Run for at least two split durations at the measured peak rate (replay a recorded source or a synthetic source at the rate in `measured_rates`).
2. `mcap info <file>` for each file: read `messages`, per-channel counts and `duration`.
3. `mcap list metadata <file>` and read `logger_stats` drop counters.
4. Compare written + dropped to produced counts from the source.

### Output
`writer_config`.

### Quality Gate
- written + dropped equals produced for every channel.
- `mcap doctor` exits 0 on every file.

---

## Worked Example

Illustrative. split 60 s, zstd, chunk size 1 MiB (user choice), queue capacity 20000.
```
$ python -m logger.run --rate-file measured_rates.json --duration 150
produced imu=30000 can=33150 gnss=1500
$ mcap info /data/drives/d1/part_0001.mcap
library:   my-logger
messages:  25862
duration:  1m0s
compression: zstd: [...]
channels:
  (1) /imu   12000 msgs (200.00 Hz) : my.Imu [jsonschema]
$ mcap list metadata /data/drives/d1/part_0001.mcap
logger_stats  {"dropped_imu":"0","dropped_can":"0"}
```

---

## Exit Criteria

DONE when the writer rotates, shuts down cleanly on both signals, and a load test shows written + dropped = produced with `mcap doctor` passing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `register_schema` or `add_message` signature differs | **Adjust**: use `help()` on the installed version; do not invent parameters. |
| Phase 2 | `.mcap.active` remains after SIGTERM | **Retry**: fix the signal handler; the drain must finish before exit. |
| Phase 3 | Drops > 0 at peak rate | **Adjust**: switch zstd to lz4 or none and retest; if drops remain, **Return** to `dlog-disk-throughput-measure`. |
| Phase 3 | GIL contention from heavy callbacks | **Adjust**: move encoding to the writer thread or a separate process; measure again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
