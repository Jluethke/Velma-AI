# Test Case Extraction from Drives

**One-line description:** Finds events in indexed drives (operator markers, diagnostics faults, user-defined signal conditions), slices each into a short self-contained MCAP with `mcap filter` using padding before and after, and registers it as a regression case with its source hash and expected outputs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `drive_index` (object, required): From `dlog-drive-index-sqlite`.
- `event_definition` (object, required): How to find events: an `events.kind` value, or a signal condition (topic, field, comparison, value set by the user), plus pre and post padding in seconds and the topics each case must contain.
- `archive_path` (string, required): Archive root, or the anonymized root when cases include camera data.

---

## Outputs

- `test_cases` (object[]): Per case: case id, source file and its SHA-256, start and end ns, slice file path and SHA-256, topics included, and the expected outputs or assertions.

---

## Phase 1: Find Events

### Entry Criteria
- `event_definition` gives either an events kind or a full signal condition with a user-set value.
- When cases include camera data, `archive_path` points at the anonymized copy from `dlog-camera-privacy-anonymize`.

### Actions
1. Indexed events: `SELECT drive_id, t_ns, detail FROM events WHERE kind = :kind`.
2. Signal condition: scan only the needed topic with `iter_decoded_messages(topics=[topic])` over the files the index returns, and emit the first `log_time` of each contiguous run where the condition holds. Merge runs closer together than the padding into one event.
3. Record each event's drive, time and triggering value.
4. Do NOT hardcode a physical threshold; the comparison value comes from `event_definition`.

### Output
Event list.

### Quality Gate
- Each event has drive_id, t_ns and the value that triggered it.

---

## Phase 2: Slice

### Entry Criteria
- Event list non-empty.

### Actions
1. Window: start = t_ns - pre_padding, end = t_ns + post_padding (ns integers).
2. Find source files overlapping the window from the index (`start_ns < end AND end_ns > start`). If more than one, merge first: `mcap merge a.mcap b.mcap -o merged.mcap` into a scratch directory outside the archive.
3. Slice: `mcap filter <src> -o case_<id>.mcap --start-nsecs <start> --end-nsecs <end> -y '<topic regex>'`. Check `mcap filter --help` for exact flag names on your CLI version (`-S/-E` take seconds on some versions).
4. Include `/tf_static` and any latched configuration topics even when their messages are older than the window; check `mcap filter --help` for an option that includes the last message before the start, or copy them in explicitly.
5. `mcap doctor case_<id>.mcap` and `mcap info case_<id>.mcap`; confirm start and end match the window and all required topics are present.
6. `sha256sum` the slice and its source file.

### Output
Slice files.

### Quality Gate
- Each slice passes `mcap doctor` and lists every topic required by `event_definition` in `mcap info`.
- Each slice's first and last message times lie inside the window.

---

## Phase 3: Register Cases

### Entry Criteria
- Slices validated.

### Actions
1. Store slices in the test data store (Git LFS, DVC or an object store; never plain Git for large binaries).
2. Write `case_<id>.yaml` beside each slice: source drive, source SHA-256, slice SHA-256, window, software commit at recording time, and expected outputs.
3. Expected outputs come from one of: a human-reviewed label, or a golden output produced by a replay flow (`dlog-ros2-bag-replay`, `dlog-py-replay-harness`, `dlog-cpp-replay-harness`) on a reviewed software version. Record which.
4. Do NOT generate expected outputs from the software under test and then test that same version against them without review; that test can never fail.

### Output
`test_cases`.

### Quality Gate
- Every case YAML lists both SHA-256 values and an expected-output source of "human label" or "reviewed golden at <commit>".

---

## Worked Example

Illustrative. `event_definition`: kind `operator_marker`, pre 8 s, post 4 s, topics `/imu/data|/lidar/points|/cam_front.*|/tf.*`.
```
$ sqlite3 drive_index.sqlite "SELECT drive_id,t_ns FROM events WHERE kind='operator_marker'"
d2026_10_21_a|1792512431200000000
$ mcap filter part_0004.mcap -o case_0007.mcap --start-nsecs 1792512423200000000 --end-nsecs 1792512435200000000 -y '/imu/data|/lidar/points|/cam_front.*|/tf.*'
$ mcap info case_0007.mcap | head -4
messages: 3712
duration: 11.998s
start: 1792512423.201...
```

---

## Exit Criteria

DONE when every event has a validated slice with hashes and a registered case file naming its expected-output source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Condition value missing in `event_definition` | **Return**: ask the user for it. |
| Phase 2 | Required topic missing in the slice | **Adjust**: widen the regex or include the latched topic, slice again. |
| Phase 2 | Window crosses a lost interval from `validation_report` | **Return**: mark the case incomplete; do not register it as a passing reference. |
| Phase 3 | No reviewed expected output | **Return**: register the case as "pending label". |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
