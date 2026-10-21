# Log Storage Budget and Rotation

**One-line description:** Computes recording hours per volume, file split size and duration, and retention from the measured byte rate and the actual free capacity of the logging volume, so rotation limits are derived numbers rather than defaults.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `measured_rates` (object[], required): From `dlog-sensor-rate-inventory`, with the total bytes per second.
- `disk_throughput` (object, required): From `dlog-disk-throughput-measure`.
- `storage_capacity_bytes` (integer, required): Usable bytes on the logging volume, read from `df -B1` (the `Available` column), not the marketed size.
- `retention_policy` (object, optional): User rules such as the number of drives to keep on the vehicle, the reserve to leave free, and the maximum length of one file that the offload or replay tools handle well.

---

## Outputs

- `storage_budget` (object): Recording hours available, bytes per hour, split size in bytes, split duration in seconds, number of files per drive hour, reserve bytes, and the formula used for each value.

---

## Phase 1: Bytes per Hour

### Entry Criteria
- `measured_rates` has a total bytes-per-second row.

### Actions
1. bytes_per_hour = total_bytes_per_second x 3600.
2. If the logger compresses (zstd or lz4 in MCAP), do NOT apply a guessed compression ratio. Either use bytes per second measured on disk from a test recording (`du -sb <bag_dir>` divided by recorded seconds from `ros2 bag info` or `mcap info`), or use the uncompressed rate as the worst case.
3. Record which of the two was used.

### Output
bytes_per_hour with its source.

### Quality Gate
- bytes_per_hour is computed from a named measured number, shown as a formula.

---

## Phase 2: Capacity and Hours

### Entry Criteria
- bytes_per_hour known.

### Actions
1. reserve_bytes = the reserve in `retention_policy`; if absent, report "no reserve given" as an open question and use 0 in the arithmetic so it is visible.
2. recordable_bytes = `storage_capacity_bytes` - reserve_bytes.
3. recording_hours = recordable_bytes / bytes_per_hour.
4. Filesystems slow down when nearly full; the reserve is how the user protects against that. Do not invent a percentage.

### Output
recording_hours.

### Quality Gate
- recording_hours equals recordable_bytes / bytes_per_hour when recomputed.

---

## Phase 3: Split Size and Duration

### Entry Criteria
- recording_hours known.

### Actions
1. Choose the split by the limiting consumer, using this table:

| Limit | Rule |
|---|---|
| Loss on power cut | A crash loses at most the unflushed tail of the open file; smaller splits bound the part needing `mcap recover`. |
| Offload tool or filesystem max file size | split_size < that maximum (FAT32 and exFAT media differ; read the medium's filesystem). |
| Replay and test extraction | split_duration matches how long a test slice usually is, so most slices touch one file. |
| User rule | `retention_policy` maximum file length. |

2. split_size_bytes = split_duration_s x total_bytes_per_second; or the reverse when size is the binding limit. Show both.
3. Map to tool flags: rosbag2 `--max-bag-size <bytes>` and `--max-bag-duration <seconds>`; python-can logger size rotation (check `python -m can.logger --help` for the file size option on your version); MCAP writers in `dlog-py-mcap-writer` and `dlog-cpp-mcap-writer` rotate by duration.
4. files_per_hour = 3600 / split_duration_s.

### Output
`storage_budget`.

### Quality Gate
- `storage_budget` lists split size and split duration and they agree with total bytes per second within rounding.
- Each limit in the table has a value or is marked not applicable.

---

## Worked Example

Illustrative. Total 23.6 MB/s measured on disk, `df -B1` Available 3,840,000,000,000 bytes, reserve 200,000,000,000 bytes from `retention_policy`, user wants 60 s files.
```
bytes_per_hour = 23,600,000 x 3600 = 84,960,000,000
recordable     = 3,840,000,000,000 - 200,000,000,000 = 3,640,000,000,000
recording_hours = 3,640,000,000,000 / 84,960,000,000 = 42.8 h
split_duration = 60 s -> split_size = 1,416,000,000 bytes
ros2 bag record ... --max-bag-duration 60 --max-bag-size 1500000000
```

---

## Exit Criteria

DONE when recording hours, split size and split duration are computed from measured inputs with formulas shown.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No total rate in `measured_rates` | **Stop**: rerun `dlog-sensor-rate-inventory`. |
| Phase 1 | Compression ratio requested without a test recording | **Adjust**: use the uncompressed rate and say so. |
| Phase 2 | recording_hours shorter than one planned drive | **Return**: report the shortfall; options are a larger volume, fewer topics or offload between drives. |
| Phase 3 | Split size exceeds the target filesystem maximum | **Adjust**: shorten split duration until it fits. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
