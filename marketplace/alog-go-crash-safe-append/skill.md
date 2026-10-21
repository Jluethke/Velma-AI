# Go Crash-Safe Append Writer

**One-line description:** Write a Go append-only log writer that forces each record to durable storage with fsync and updates the chain head with an atomic rename, so a crash cannot leave a half-written or unlinked record.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chain_link_spec` (object, required): The linkage and genesis rules the writer enforces when it sets prev_hash and seq.
- `go_canonical_hasher` (object, required): The canonical-hash module used to compute each record's content_hash before the write.
- `repo_path` (string, required): Path to the repository where the writer module and its crash test are written.

---

## Outputs

- `go_append_writer` (object): The Go writer module path, the append function name, and the result of the crash and fsync tests.

---

## Phase 1: Durable append of one record

### Entry Criteria
- `repo_path` is writable and `go_canonical_hasher` is importable.
- `chain_link_spec` defines prev_hash and seq assignment.

### Actions
1. Load the current chain head (last `content_hash` and `seq`) from the head pointer file; if absent, start the genesis record per `chain_link_spec`.
2. Build the record, set `prev_hash` and `seq` from the head, compute `content_hash` with `go_canonical_hasher`, then canonicalize the full record line for storage.
3. Open with `os.OpenFile(path, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0o640)`, write with `f.Write(line)`, then force to disk with `f.Sync()`; O_APPEND keeps writes at the end of the file.
4. Flush the application buffer and call fsync on the log file descriptor so the record bytes reach the disk before the append is reported complete. Do NOT rely on language-level flush alone; flush empties the process buffer, fsync forces the kernel page cache to the device.
5. Open the log for append only (do not truncate) and never seek backward; an append-only open prevents an accidental overwrite of earlier records.

### Output
One record appended and forced to disk, with its content_hash computed.

### Quality Gate
- The record line is written then fsync is called on the file before returning.
- The log is opened in append mode, never truncating existing bytes.
- `prev_hash` and `seq` are set from the loaded head per `chain_link_spec`.

---

## Phase 2: Atomic head update and crash test

### Entry Criteria
- The record is durably appended.

### Actions
1. Update the chain head pointer by writing the new head to a temporary file in the same directory, fsync the temporary file, then atomically rename it over the head file, then fsync the directory so the rename is durable.
2. State the ordering rule: append and fsync the record first, then update the head; if a crash happens between the two, the record exists and a recovery scan re-derives the head, so no record is lost and the head never points past a missing record.
3. Write a crash test that appends records, simulates a crash by not updating the head on the last write, then runs recovery and asserts the chain still verifies and the head is rebuilt from the log tail.
4. Run the test and read the output; do NOT mark the writer done until the recovery test passes on a run you executed.

### Output
`go_append_writer` with the durable writer and a passing crash-recovery test.

### Quality Gate
- The head is updated by temp-file write, fsync, atomic rename, then directory fsync.
- Record fsync happens before the head update, proven by the recovery test.
- The crash-recovery test passes on an executed run and rebuilds the head from the log.

---

## Worked Example

Phase 2 run (illustrative):

```
go test ./audit/writer/ -run TestAppendCrash -v
append 100 records, drop head on #100, recover ...
recovered head seq=99, chain verify OK
```

`go_append_writer` records the writer path and PASS. Head update uses `os.Rename(tmp, head)` then a directory `Sync()`.

---

## Exit Criteria

DONE when the Go writer fsyncs each appended record before updating the head, updates the head by atomic rename with a directory fsync, and a crash-recovery test passes and is recorded in `go_append_writer`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only a language flush is used, no fsync | **Adjust**: add the fsync call; a flush that returns before the device write leaves records lost on power failure. |
| Phase 2 | Head is updated before the record is durable | **Stop**: reorder so the record is fsynced first; a head pointing past a missing record breaks verification. |
| Phase 2 | The directory is not fsynced after rename | **Adjust**: fsync the directory file descriptor so the rename survives a crash. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
