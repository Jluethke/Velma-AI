# Python Staleness and Timeout Checker

**One-line description:** Implements a Python checker that flags a signal as stale when its newest sample is older than `max_age_ms`, as silent when no sample arrives at all, and as corrupted when a sequence counter repeats, skips or goes backward, using `time.monotonic_ns()` through an injectable clock so tests never sleep.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`; rows with numeric `max_age_ms` and `expected_period_ms`.
- `repo_dir` (string, required): Monitor repository root.

---

## Outputs

- `py_staleness_checker` (object): Module path (`monitor/staleness.py`), test path (`tests/test_staleness.py`), pytest summary line, envelope hash.

---

## Phase 1: Implement

### Entry Criteria
- At least one envelope row has numeric `max_age_ms`. Rows where it is open are skipped and listed.

### Actions
1. Create ONE file `monitor/staleness.py`:
   ```python
   import time

   class StalenessChecker:
       def __init__(self, max_age_ns, seq_modulo=None, clock=time.monotonic_ns):
           self.max_age_ns = max_age_ns
           self.mod = seq_modulo      # for example 2**16 for a uint16 counter; None if no counter
           self.clock = clock
           self.last_rx_ns = None
           self.last_seq = None

       def on_message(self, seq=None):
           now = self.clock()
           verdict = "pass"
           if self.mod is not None and seq is not None and self.last_seq is not None:
               delta = (seq - self.last_seq) % self.mod
               if delta == 0:
                   verdict = "fail"          # repeated: frozen producer
               elif delta != 1:
                   verdict = "fail"          # skipped or backward
           self.last_rx_ns, self.last_seq = now, seq
           return verdict

       def poll(self):
           if self.last_rx_ns is None:
               return "stale"                # never received counts as stale
           return "stale" if self.clock() - self.last_rx_ns > self.max_age_ns else "pass"
   ```
2. `poll()` must be called from a periodic timer in the monitor loop, NOT from the message callback; a callback that never runs cannot detect silence.
3. Use `time.monotonic_ns()` only. `time.time()` jumps with NTP and daylight changes. If the message carries a producer timestamp from another host, do not compare it with the local clock unless both clocks are synchronized and the sync error is a documented bound.
4. Whether a counter skip should trip or only count depends on requirements. If the requirement allows K lost messages, make K a constructor argument loaded from the envelope; do not hardcode it.

### Output
`monitor/staleness.py`.

### Quality Gate
- `rg -n "time\.time\(|datetime\.now" monitor/staleness.py` returns nothing.
- `python -c "import monitor.staleness"` exits 0.

---

## Phase 2: Deterministic Tests

### Entry Criteria
- Module imports.

### Actions
1. Create `tests/test_staleness.py` using a fake clock:
   ```python
   class FakeClock:
       def __init__(self): self.t = 0
       def __call__(self): return self.t
   ```
2. Cases: poll before any message gives `stale`; message then poll at exactly `max_age_ns` gives `pass`; at `max_age_ns + 1` gives `stale`; counter 65535 then 0 with `seq_modulo=2**16` gives `pass` (wrap); counter repeated gives `fail`; counter jump by 2 gives `fail`; counter backward gives `fail`.
3. Run `python -m pytest tests/test_staleness.py -q`.
4. No `time.sleep` in tests: `rg -n "sleep" tests/test_staleness.py` must return nothing.

### Output
`py_staleness_checker`.

### Quality Gate
- pytest exits 0 with all cases passing.
- `rg -c "2\*\*16|65535" tests/test_staleness.py` is greater than 0 (wrap case exists).

---

## Worked Example

Illustrative only. Envelope row `wheel_ticks`: `expected_period_ms` 10 (ICD), `max_age_ms` 30 (requirement SYS-220).
```
$ python -m pytest tests/test_staleness.py -q
.......                                                        [100%]
7 passed in 0.05s
```
In the monitor, a 10 ms timer calls `poll()`. Unplugging the encoder cable on the bench yields `stale` on the first poll after 30 ms of silence.

---

## Exit Criteria

DONE when staleness, silence and counter faults are detected on a monotonic injectable clock, the poll runs from a timer, and all tests pass without sleeping.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `max_age_ms` is open for a signal | **Adjust**: skip it and keep it in the open questions list. |
| Phase 1 | Message has no sequence counter | **Adjust**: set `seq_modulo=None`; record that frozen-value faults need a content check instead. |
| Phase 2 | Test flakes | **Stop**: a flaky timing test means real time leaked in; find the `time.` call and route it through the clock. |

**Do not:** use wall time, call `poll()` only from the receive callback, or sleep in unit tests.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
