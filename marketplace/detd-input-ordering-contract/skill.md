# Input Ordering Contract for a Single-Threaded Decision Step

**One-line description:** Removes thread scheduling and I/O arrival order from the decision result by defining a single-threaded `step(state, batch, now_ns)` function, a total sort key for every input message, a tick boundary rule and a late-arrival rule, so that the recorded batch order is the only order the decision ever sees.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `nondeterminism_sources` (object[], required): Rows with category scheduling or io_order from `detd-nondeterminism-inventory`.

---

## Outputs

- `ordering_contract` (object): Step signature, the ordered list of sort key fields, tick boundary rule, late-arrival rule, clock source, and the file and function where the sort happens.

---

## Phase 1: Map Inputs and Threads

### Entry Criteria
- `nondeterminism_sources` is available (may contain zero scheduling rows; still map inputs).

### Actions
1. List every input source to the decision: sensor topics, CAN frames, operator commands, timers, configuration reloads. For each, record the producing thread or task and whether the message carries a source timestamp and a sequence counter.
2. List every place the decision state is mutated. If more than one thread mutates it, that is a defect for this contract: record it.
3. Draw the current flow as a table: source, thread, queue or callback, where it reaches decision state.

### Output
Input and thread map.

### Quality Gate
- Every input source has a row with thread, timestamp field (or "none") and sequence field (or "none").
- Every state mutation site is listed with file and line.

---

## Phase 2: Define the Contract

### Entry Criteria
- Map complete.

### Actions
1. Step signature: `step(state, batch, now_ns) -> (new_state, outputs)`. It is the only code that reads or writes decision state, and it runs on one thread.
2. I/O threads only enqueue messages. At each tick the loop drains the queue into `batch`.
3. Sort key, applied to `batch` before `step`, in this field order:
   1. `recv_ns`: monotonic receive time stamped by the I/O thread (`CLOCK_MONOTONIC`; not wall time, which can jump).
   2. `source_id`: a fixed integer per source, assigned in a config file, not at runtime registration order.
   3. `source_seq`: per-source counter assigned at receive.
   The key must be total: two different messages never compare equal. `source_seq` guarantees that.
4. Tick boundary rule: a message belongs to the tick whose drain call removes it from the queue. Record that membership; do not recompute it during replay.
5. Late-arrival rule, choose one and write it down:

| Rule | Use when |
|---|---|
| Process in the tick it was drained, regardless of `recv_ns` | Simple loops; replay uses recorded membership |
| Hold messages until a watermark, then release in key order | Multiple sources with known bounded latency; the watermark is a user input taken from measured latency, recorded in config |

6. `now_ns` comes from the injected clock read once per tick, before `step`.
7. Recording happens AFTER sorting and BEFORE `step`, so the record captures exactly what `step` saw.

### Output
`ordering_contract` draft.

### Quality Gate
- The sort key has three named fields and the doc states why ties are impossible.
- The contract names one file and function where sorting happens and one where recording happens.

---

## Phase 3: Enforce and Test

### Entry Criteria
- Contract drafted.

### Actions
1. Implement the sort at the named function. Edit that one place, then run the test suite.
2. Add a test that feeds the same messages in two different arrival orders into the drain-sort path and asserts the batch passed to `step` is identical.
3. Add a test, or an assertion in debug builds, that `step` is always called from the same thread id (Python `threading.get_ident()`, C++ `std::this_thread::get_id()`, Go has no goroutine id, so assert instead that only one goroutine owns the state by passing it through a channel).
4. Rerun `detd-double-run-check` with the thread count perturbation.

### Output
Final `ordering_contract` with test names.

### Quality Gate
- The arrival-order test passes.
- The thread count row in the double run report shows `identical: true`.

---

## Worked Example

Illustrative only. Sources: radar (thread R, source_id 1), camera (thread C, source_id 2), operator (thread O, source_id 3). Before: radar and camera callbacks both mutated `track_table` directly. After: callbacks enqueue `{recv_ns, source_id, source_seq, payload}`; the loop drains, sorts by `(recv_ns, source_id, source_seq)`, records, calls `step`. Test `test_arrival_order_independent` passes. Thread count perturbation `cmp` exit 0.

---

## Exit Criteria

DONE when one thread owns decision state, every batch is sorted by a total key before the step, recording sits between sort and step, and the arrival-order test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A source has no sequence counter | **Adjust**: assign `source_seq` at receive in the I/O thread. |
| Phase 2 | Decision state is shared with a UI or logger thread | **Adjust**: give that thread a copy produced by `step` outputs. |
| Phase 3 | Arrival-order test fails | **Retry**: the key is not total or sorting is not applied before `step`; fix and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
