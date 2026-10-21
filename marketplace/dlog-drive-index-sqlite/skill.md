# Drive Index in SQLite

**One-line description:** Builds a SQLite index of archived drives with drives, files, topics and events tables filled from each MCAP file's summary (`get_summary()` statistics and channels) and the run manifests, so engineers can find drives by date, software version, topic, duration and event with plain SQL.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `archive_path` (string, required): Archive root holding one directory per drive.
- `run_manifest` (object, required): From `dlog-run-manifest`; the manifest of the newest drive (others are read from disk).
- `hash_manifest` (object, required): From `dlog-file-integrity-hashes`; file hashes to store.

---

## Outputs

- `drive_index` (object): Path of the SQLite database, table row counts, and the example queries that were run with their results.

---

## Phase 1: Create the Schema

### Entry Criteria
- Python 3 with the standard `sqlite3` module and `pip install mcap`.

### Actions
1. Create `drive_index.sqlite` next to (not inside) the drive directories. Schema:
   ```sql
   CREATE TABLE IF NOT EXISTS drives(drive_id TEXT PRIMARY KEY, start_ns INTEGER, end_ns INTEGER,
     git_commit TEXT, git_dirty INTEGER, vehicle_id TEXT, purpose TEXT, sums_sha256 TEXT);
   CREATE TABLE IF NOT EXISTS files(path TEXT PRIMARY KEY, drive_id TEXT REFERENCES drives,
     sha256 TEXT, size_bytes INTEGER, start_ns INTEGER, end_ns INTEGER, message_count INTEGER);
   CREATE TABLE IF NOT EXISTS topics(path TEXT REFERENCES files, topic TEXT, schema_name TEXT,
     message_encoding TEXT, message_count INTEGER, PRIMARY KEY(path, topic));
   CREATE TABLE IF NOT EXISTS events(drive_id TEXT, t_ns INTEGER, kind TEXT, detail TEXT);
   CREATE INDEX IF NOT EXISTS files_time ON files(start_ns, end_ns);
   CREATE INDEX IF NOT EXISTS topics_topic ON topics(topic);
   ```
2. Store all times as INTEGER nanoseconds. Never store them as REAL.

### Output
Empty database with schema.

### Quality Gate
- `sqlite3 drive_index.sqlite ".tables"` lists drives, events, files, topics.

---

## Phase 2: Load Drives

### Entry Criteria
- Schema exists.

### Actions
1. For each drive directory in `archive_path`, read `run_manifest.json` and `SHA256SUMS`.
2. For each `.mcap` file read the summary only (no full scan):
   ```python
   from mcap.reader import make_reader
   with open(p, "rb") as f:
       s = make_reader(f).get_summary()
   st = s.statistics   # message_count, message_start_time, message_end_time, channel_message_counts
   for cid, ch in s.channels.items():
       schema = s.schemas.get(ch.schema_id)
   ```
   `get_summary()` returns None for a file without a summary section; those must go through `dlog-log-validate-recover` first.
3. Insert with `INSERT OR REPLACE` so reruns are idempotent; wrap each drive in one transaction.
4. Events: insert operator markers (a marker topic), recorded faults (`/diagnostics` levels), and lost intervals from `validation_report` if available, with `kind` names the team agrees on.

### Output
Loaded database.

### Quality Gate
- `SELECT count(*) FROM files` equals the number of `.mcap` files under `archive_path`.
- For every file, `sha256` in the table equals its line in that drive's `SHA256SUMS`.

---

## Phase 3: Prove It Answers Queries

### Entry Criteria
- Data loaded.

### Actions
1. Run and save output of:
   - Drives on one software version: `SELECT drive_id, start_ns FROM drives WHERE git_commit = '<sha>';`
   - Files containing a topic in a time window: `SELECT f.path FROM files f JOIN topics t USING(path) WHERE t.topic = '/lidar/points' AND f.start_ns < :end AND f.end_ns > :start;`
   - Total hours per vehicle: `SELECT vehicle_id, sum(end_ns - start_ns)/3.6e12 FROM drives GROUP BY vehicle_id;`
2. Check one answer by hand against `mcap info` for a file.

### Output
`drive_index`.

### Quality Gate
- All three queries return without error and the hand check matches.

---

## Worked Example

Illustrative.
```
$ python tools/index_drives.py /archive/drives drive_index.sqlite
indexed 14 drives, 812 files, 6496 topic rows
$ sqlite3 drive_index.sqlite "SELECT count(*) FROM files"
812
$ sqlite3 drive_index.sqlite "SELECT f.path FROM files f JOIN topics t USING(path) WHERE t.topic='/lidar/points' AND f.start_ns < 1792512600000000000 AND f.end_ns > 1792512000000000000"
/archive/drives/d2026_10_21_a/part_0004.mcap
```

---

## Exit Criteria

DONE when every archived MCAP file is indexed with hash, time span and topics, and the sample queries return checked answers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `get_summary()` returns None | **Return**: send the file to `dlog-log-validate-recover`; index the recovered copy. |
| Phase 2 | Hash mismatch with SHA256SUMS | **Stop**: the archive copy changed; rerun `dlog-offload-verify`. |
| Phase 3 | Query result disagrees with `mcap info` | **Adjust**: fix the loader, drop and rebuild the affected rows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
