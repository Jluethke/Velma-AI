# MCAP to Parquet Export

**One-line description:** Exports selected decoded topics from archived MCAP drives to a Hive-partitioned Parquet dataset with `pyarrow`, keeping `log_time` and header stamps as int64 nanoseconds, and proves completeness by matching DuckDB row counts to MCAP message counts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `archive_path` (string, required): Archive root.
- `drive_index` (object, required): From `dlog-drive-index-sqlite`; used to select files and expected message counts.
- `export_topics` (string[], optional): Topics to export. Default: none, the user must name them; exporting images or point clouds to Parquet is rarely useful.

---

## Outputs

- `parquet_dataset` (object): Dataset root path, partition layout, per-topic Arrow schema, row counts per partition, and the DuckDB verification queries with results.

---

## Phase 1: Define Schemas

### Entry Criteria
- `pip install pyarrow mcap mcap-ros2-support duckdb` succeeded; versions recorded.
- `export_topics` is not empty.

### Actions
1. For each topic, decode one message (ROS 2: `make_reader(f, decoder_factories=[DecoderFactory()])` and `iter_decoded_messages`) and list the scalar fields to keep.
2. Build a `pyarrow.schema` per topic. Always include `log_time_ns: pa.int64()` and, for stamped messages, `stamp_ns: pa.int64()` computed as `sec * 1_000_000_000 + nanosec`, plus `drive_id: pa.string()`.
3. Do NOT convert times to float seconds. Unix time in ns is about 1.8e18, beyond the 2^53 exact-integer range of float64, so float storage loses nanoseconds.
4. Flatten nested fields with clear names (`linear_acceleration_x`); fixed-size arrays such as covariance become `pa.list_(pa.float64())`.

### Output
Arrow schema per topic.

### Quality Gate
- Every schema has `log_time_ns` typed int64.

---

## Phase 2: Write the Dataset

### Entry Criteria
- Schemas defined.

### Actions
1. Select files from the index: `SELECT f.path FROM files f JOIN topics t USING(path) WHERE t.topic IN (...)`.
2. Read each file once with `iter_decoded_messages(topics=export_topics, log_time_order=True)`; accumulate rows per topic into column lists; convert to `pa.Table.from_pydict(cols, schema=schema)` in batches so memory stays bounded.
3. Write with `pyarrow.parquet.write_to_dataset(table, root_path=<root>/<topic_name>, partition_cols=["drive_id"])` or `pyarrow.dataset.write_dataset(..., format="parquet", partitioning=["drive_id"], partitioning_flavor="hive")`. Choose compression explicitly (`compression="zstd"` via file options) and record it.
4. Write the dataset to a new root; never into `archive_path` drive directories (they are read-only and hashed).

### Output
Parquet files under `<root>/<topic>/drive_id=<id>/`.

### Quality Gate
- `find <root> -name "*.parquet" | wc -l` is greater than zero for every exported topic.

---

## Phase 3: Verify with DuckDB

### Entry Criteria
- Dataset written.

### Actions
1. For each topic and drive: `duckdb -c "SELECT drive_id, count(*) FROM read_parquet('<root>/<topic>/**/*.parquet', hive_partitioning=true) GROUP BY drive_id"`.
2. Compare to `SELECT d.drive_id, sum(t.message_count) FROM topics t JOIN files f USING(path) JOIN drives d USING(drive_id) WHERE t.topic='<topic>' GROUP BY d.drive_id` from the index.
3. Check monotonic time: `SELECT count(*) FROM (SELECT log_time_ns - lag(log_time_ns) OVER (PARTITION BY drive_id ORDER BY log_time_ns) AS d FROM read_parquet(...)) WHERE d < 0` must be 0.
4. Check type: `DESCRIBE SELECT * FROM read_parquet(...)` shows `log_time_ns BIGINT`.

### Output
`parquet_dataset`.

### Quality Gate
- Row counts equal index message counts for every topic and drive.
- `log_time_ns` is BIGINT in DuckDB's DESCRIBE.

---

## Worked Example

Illustrative. `export_topics` = [`/imu/data`].
```
$ python tools/export_parquet.py --index drive_index.sqlite --topics /imu/data --out /analytics/pq
$ duckdb -c "SELECT drive_id, count(*) FROM read_parquet('/analytics/pq/imu_data/**/*.parquet', hive_partitioning=true) GROUP BY 1"
d2026_10_21_a | 30004
$ sqlite3 drive_index.sqlite "SELECT sum(message_count) FROM topics WHERE topic='/imu/data' AND path LIKE '%d2026_10_21_a%'"
30004
```

---

## Exit Criteria

DONE when each exported topic's Parquet row counts match the index and times are int64 ns.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Message type has no decoder | **Adjust**: install the matching support package (`mcap-protobuf-support` for protobuf) or skip the topic and report it. |
| Phase 2 | Out of memory | **Adjust**: write smaller batches per file. |
| Phase 3 | Count mismatch | **Stop**: find the dropped batch; never publish a partial dataset. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
