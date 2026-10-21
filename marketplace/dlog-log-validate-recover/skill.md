# Log File Validation and Recovery

**One-line description:** Validates every file of a drive with the format's own tool (`mcap doctor` and `mcap info` for MCAP, `ros2 bag info` for rosbag2, a full `can.BLFReader` pass for BLF) and recovers truncated files from power loss into new copies with `mcap recover` or `ros2 bag reindex`, never modifying the original.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_dir` (string, required): Directory of one drive.
- `log_format_decision` (object, required): From `dlog-format-select`; tells which validator applies to each file.

---

## Outputs

- `validation_report` (object): Per file: format, validator command, exit code, error lines, recovered file path if any, message counts before and after recovery.

---

## Phase 1: Validate

### Entry Criteria
- The recorder is stopped. `lsof +D <log_dir>` shows no writer holding a file open.

### Actions
1. Make the directory read-only for the audit: `chmod -R a-w <log_dir>` (restore later only if recovery writes into a sibling directory). This prevents accidental edits.
2. MCAP: for each `*.mcap` run `mcap doctor <file>; echo $?` and `mcap info <file>`. A file cut by power loss usually lacks the summary section and footer; `mcap info` reports an error reading the footer.
3. rosbag2: `ros2 bag info <bag_dir>`. If `metadata.yaml` is missing or wrong, the bag is incomplete.
4. BLF: `python -c "import can,sys; n=sum(1 for _ in can.BLFReader(sys.argv[1])); print(n)" <file>`; an exception or a count far below the capture's expected count indicates truncation.
5. candump logs: last line complete (`tail -n 1`) and parsable.

### Output
Per-file validation table.

### Quality Gate
- Every file in `log_dir` has a validator exit code recorded.

---

## Phase 2: Recover into New Files

### Entry Criteria
- At least one file failed Phase 1.

### Actions
1. Create `<log_dir>_recovered/`. Never write into `<log_dir>`.
2. MCAP: `mcap recover <file> -o <log_dir>_recovered/<name>.mcap`. It rebuilds indexes and summary from readable chunks; data in a partly written final chunk can be lost.
3. rosbag2 directory missing `metadata.yaml`: copy the bag directory into `<log_dir>_recovered/` and run `ros2 bag reindex <copied_dir> -s <mcap|sqlite3>` on the copy.
4. BLF truncated: read with `can.BLFReader` until the exception and write a new BLF with `can.BLFWriter`; record the last good timestamp.
5. Run Phase 1 validators on every recovered file.

### Output
Recovered files.

### Quality Gate
- Every recovered file passes its validator (`mcap doctor` exit 0, `ros2 bag info` succeeds, BLF reads to the end).
- Original files have unchanged modification times (`stat -c %Y`).

---

## Phase 3: Report Loss

### Entry Criteria
- Recovery done or not needed.

### Actions
1. For each recovered file record messages recovered and the last `log_time` recovered; compare against the next file's first `log_time` to estimate the lost interval.
2. Write `validation_report`. Downstream flows use the recovered copy and must reference it by path.

### Output
`validation_report`.

### Quality Gate
- Every failed file has either a recovered path with a lost interval in ns, or a reason it could not be recovered.

---

## Worked Example

Illustrative.
```
$ mcap doctor part_0007.mcap; echo $?
Failed to read footer: ... unexpected EOF
1
$ mcap recover part_0007.mcap -o ../d1_recovered/part_0007.mcap
Recovered 18210 messages, 0 attachments, and 0 metadata records.
$ mcap doctor ../d1_recovered/part_0007.mcap; echo $?
0
```
Lost interval: last recovered `log_time` ...812400000, next file starts ...813050000: 650 ms lost.

---

## Exit Criteria

DONE when every file is valid or has a validated recovered copy and a measured lost interval.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A writer still holds a file open | **Stop**: stop the recorder cleanly; never validate a file being written. |
| Phase 2 | `mcap recover` yields zero messages | **Return**: report the file as unrecoverable with its size. |
| Phase 2 | `ros2 bag reindex` fails | **Adjust**: run `mcap recover` per `.mcap` file in the copy, then reindex again. |
| Phase 3 | Lost interval overlaps a test event | **Return**: flag the event as incomplete in the report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
