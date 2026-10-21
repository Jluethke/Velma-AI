# Python Boundary Recorder

**One-line description:** Implements a Python recorder that captures each sorted input batch, clock value and output at the decision boundary as canonical JSON Lines with a SHA-256 hash chain, written by a background thread through a bounded queue that never blocks the decision loop and writes an explicit gap record when it drops data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `record_schema` (object, required): Output of `detd-boundary-record-schema` with JSON Lines encoding.

---

## Outputs

- `recorder_patch` (string): Path to the patch adding the recorder.
- `sample_recording` (string): Path to a recording made with the new recorder that passes the chain check.

---

## Phase 1: Implement the Writer

### Entry Criteria
- `record_schema` encoding is JSON Lines.
- Existing tests pass with `pytest -q`; record the count.

### Actions
1. Create `recorder.py` with a class `BoundaryRecorder(path, header)`:
   - `record(tick_index, now_ns, batch, outputs)` builds the tick dict and calls `self._q.put_nowait(item)`. On `queue.Full`, increment `self._dropped` and return. It must never call `put()` without `nowait`, which would block the decision loop.
   - A daemon `threading.Thread` takes items, serializes with `json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False)`, computes the chain hash with `hashlib.sha256`, and writes one line per tick.
   - Before writing the next tick after a drop, it writes `{"gap": <count>, "after_tick": <last written tick_index>}` and resets the count.
2. Queue size: `queue.Queue(maxsize=N)` where N is a configuration value computed from the measured tick rate and the chosen flush interval; record the value and its derivation in config. Do not pick a number without the measurement.
3. Floats in outputs are written with `float.hex()`; bytes with `base64.b64encode(...).decode("ascii")`.
4. `close()` puts a sentinel, joins the thread, calls `f.flush()` and `os.fsync(f.fileno())`.
5. Compress after close if needed (`zstd` CLI or `gzip`); never compress inside the hot path.

### Output
`recorder.py`.

### Quality Gate
- `rg -n '\.put\(' recorder.py` finds no blocking `put` on the decision side.
- `python -c "import recorder"` exits 0.

---

## Phase 2: Wire at the Boundary

### Entry Criteria
- Recorder module imports.

### Actions
1. In the loop function named by the ordering contract, call `recorder.record(...)` after the batch is sorted and after `step` returns outputs; pass the batch exactly as given to `step`.
2. The header is written once at open with fields from the schema (`code_commit`, `config_sha256`, `seeds`, `platform`, `environment`).
3. Make recording switchable by config, default on for development and field logging; when off, the call is a no-op.
4. Run `pytest -q` after wiring.

### Output
Recorder wired.

### Quality Gate
- `pytest -q` passed count is not lower than the Entry count.

---

## Phase 3: Verify a Real Recording

### Entry Criteria
- Recorder wired.

### Actions
1. Run the program on a test scenario long enough to cover several ticks, with recording on.
2. Write a small checker (or use the one from the replay harness flow) that reads the file, recomputes every hash from the canonical bytes, confirms `tick_index` is consecutive, and lists gap records.
3. Overload test: run with the writer thread artificially slowed (for example an injected sleep in a test-only subclass) and confirm the decision loop timing is unchanged and gap records appear.
4. `git diff > detd_recorder.patch`.

### Output
`recorder_patch`, `sample_recording`.

### Quality Gate
- The checker prints zero chain breaks and zero index gaps on the normal run.
- The overload run shows at least one `gap` record and the loop's per-tick time does not increase (compare the logged tick durations).

---

## Worked Example

Illustrative only. Phase 3: `python check_record.py runs/2026-10-21_a.jsonl` prints `header ok, 1200 ticks, chain ok, gaps 0`. Overload run prints `gaps 3 (dropped 41 ticks)`, and mean tick time is the same as the normal run.

---

## Exit Criteria

DONE when the recorder writes canonical, hash-chained ticks without ever blocking the loop, marks drops as gaps, and a real recording passes the checker.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `allow_nan=False` raises on output | **Adjust**: the decision produced NaN; encode it explicitly per schema and report the source as a defect. |
| Phase 2 | Batch passed to recorder differs from batch passed to `step` | **Stop**: record the same object reference, after sorting. |
| Phase 3 | Chain breaks on a normal run | **Retry**: serialization is not canonical (likely dict order or float format); fix and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
