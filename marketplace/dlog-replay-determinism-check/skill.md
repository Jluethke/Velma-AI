# Replay Determinism Check

**One-line description:** Compares the outputs of two or more identical offline replays message by message (topic, log time, payload hash), locates the first divergence, and traces it to a named nondeterminism source using a fixed decision table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `replay_output_dirs` (string[], required): Two or more output directories produced by `dlog-ros2-bag-replay`, `dlog-py-replay-harness` or `dlog-cpp-replay-harness` with identical settings.
- `entry_point` (string, required): The code under test, used to locate sources of divergence.

---

## Outputs

- `determinism_report` (object): Whether the runs are identical, the first divergent message (topic, index, log time), counts of differing messages per topic, the classified cause, and the fix applied or proposed.

---

## Phase 1: Compare Outputs

### Entry Criteria
- At least two output directories exist, each with an output MCAP that passes `mcap doctor`.

### Actions
1. `sha256sum` each output file. Equal hashes: runs are identical; skip to Phase 3 and report IDENTICAL.
2. Otherwise compare in message order with a small script using `make_reader(f).iter_messages(log_time_order=True)` on both files at once, emitting per message: topic, `log_time`, and `hashlib.sha256(message.data).hexdigest()`.
3. Report the first index where topic, log time or payload hash differ, and the count of differing messages per topic.
4. ROS 2 output bags also store receive time as `log_time`, which varies run to run; for those, compare `publish_time` or the header stamp inside the payload instead, and say which field was used.

### Output
Divergence list.

### Quality Gate
- The report names the comparison key used and the first divergent index, or states IDENTICAL from equal hashes.

---

## Phase 2: Classify the Cause

### Entry Criteria
- A divergence exists.

### Actions
1. Apply this table to the first divergence; first match wins:

| Symptom | Likely source | Check |
|---|---|---|
| Message present in one run, missing in another (ROS 2) | Dropped message under load or QoS depth | Compare input counts per run; raise subscriber depth; replay at `--rate` below 1.0 |
| Same messages, different order at equal times | Executor or thread scheduling | Run single-threaded executor or the library harness |
| Payload differs in low-order float bits | Floating point evaluation order, FMA contraction, `-ffast-math`, parallel reductions | Rebuild with the same flags; for GCC and Clang test `-ffp-contract=off`; compare with a numeric tolerance only if the user accepts one |
| Payload differs in IDs or ordering of lists | Hash or unordered container iteration, `PYTHONHASHSEED` | Sort before output; set `PYTHONHASHSEED=0` |
| Payload differs from the first message | Unseeded RNG or wall clock use | Re-run the grep from the harness flows |
| Differences start after a time jump | Timer or clock not driven by sim time | Check `use_sim_time` on every node or the injected clock |

2. Edit only the source the table points to, one change at a time, and rerun the replays twice after each change.
3. Do NOT hide a difference by loosening the comparison without the user's explicit tolerance; report it instead.

### Output
Cause and fix.

### Quality Gate
- The cause names a table row and the evidence (file and line, or flag) that confirms it.

---

## Phase 3: Report

### Entry Criteria
- Runs identical, or cause classified.

### Actions
1. Rerun the two replays after any fix and recompute hashes.
2. Write `determinism_report` with before and after hashes.
3. If the cause is inherent to the ROS 2 graph (row 1 or 2) and the fix is not in scope, report the replay as an integration test with known nondeterminism and recommend the library harness for exact regression.

### Output
`determinism_report`.

### Quality Gate
- The report includes the final pair of output hashes from runs made after the last code change.

---

## Worked Example

Illustrative.
```
$ sha256sum run1/out.mcap run2/out.mcap
88b2...19fe  run1/out.mcap
c013...7a22  run2/out.mcap
$ python tools/cmp_mcap.py run1/out.mcap run2/out.mcap
first divergence: index 57 /perception/objects log_time 1792512428100000000
differing: /perception/objects 62 of 119
```
Classified: payload differs in list order; `tracker.cpp:212` iterates `std::unordered_map` to build output. Fix: sort by track id. After fix both runs hash `91fa...03be`.

---

## Exit Criteria

DONE when the runs are proven identical by hash, or the divergence is classified with evidence and the final hashes are reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fewer than two runs | **Stop**: run the replay flow again. |
| Phase 1 | Settings differ between runs | **Stop**: rerun with identical commands; the comparison is invalid. |
| Phase 2 | No table row matches | **Return**: report the first divergence with full payload dumps for manual review. |
| Phase 3 | Fix makes unit tests fail | **Adjust**: fix the code, never the test expectations. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
