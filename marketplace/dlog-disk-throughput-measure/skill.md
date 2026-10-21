# Logging Disk Sustained Throughput

**One-line description:** Measures the sustained sequential write throughput of the logging volume with `fio`, run long enough to exhaust any SSD write cache, watches it with `iostat` and `nvme smart-log`, and compares it to the measured sensor byte rate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_volume_path` (string, required): Mount point of the volume that will hold logs, for example `/data`.
- `measured_rates` (object[], required): Output of `dlog-sensor-rate-inventory`, including the total bytes per second.

---

## Outputs

- `disk_throughput` (object): Burst and sustained write bandwidth in bytes per second, the time at which bandwidth dropped (cache exhaustion), device temperature during the test, filesystem type, and the ratio of sustained bandwidth to total sensor rate.

---

## Phase 1: Identify the Device

### Entry Criteria
- `log_volume_path` is mounted and has free space at least the size of the planned test file.

### Actions
1. `findmnt -T <log_volume_path>` to get the device and filesystem type.
2. `lsblk -o NAME,MODEL,SIZE,ROTA,TRAN` to identify the drive model and bus.
3. `df -B1 <log_volume_path>` and record free bytes.
4. For NVMe, `sudo nvme smart-log /dev/nvme0` (nvme-cli) and record `temperature` and `percentage_used` before the test.
5. Do NOT run the test on a volume with existing logs that are not yet offloaded; the test writes a large file and could fill it.

### Output
Device facts table.

### Quality Gate
- Device model, filesystem and free bytes are recorded from command output.

---

## Phase 2: Run fio Past the Cache

### Entry Criteria
- Device facts recorded.

### Actions
1. Choose a test size larger than the drive's SLC or DRAM write cache. If the cache size is not published, use a test size several times larger than the longest single drive file you plan to write and let the time-based run expose the drop.
2. Run:
   ```
   fio --name=seqwrite --filename=<log_volume_path>/fio.test --rw=write --bs=1M \
       --size=<size> --direct=1 --ioengine=libaio --iodepth=<n> \
       --runtime=<seconds> --time_based --write_bw_log=seqwrite --log_avg_msec=1000 \
       --group_reporting
   ```
   `<n>` and `<seconds>` are user choices; record them.
3. In a second terminal run `iostat -xm 1 <device>` and watch `wMB/s`, `w_await` and `%util`.
4. After the run, read the `WRITE: bw=` line from fio and the per-second log `seqwrite_bw.1.log`. Find the second where bandwidth drops and stays lower: that is the cache exhaustion point. Sustained bandwidth is the mean after that point.
5. Run `sudo nvme smart-log /dev/nvme0` again; if `Warning Temperature Time` increased, the drive throttled and the sustained number includes throttling. Record it.
6. Delete the test file: `rm <log_volume_path>/fio.test`.

### Output
Burst and sustained bandwidth with the drop time.

### Quality Gate
- `seqwrite_bw.1.log` exists and the sustained figure is computed from its post-drop rows.
- The test file is gone (`ls <log_volume_path>/fio.test` fails).

---

## Phase 3: Compare to Sensor Rate

### Entry Criteria
- Sustained bandwidth known.

### Actions
1. Compute ratio = sustained bandwidth / total bytes per second from `measured_rates`.
2. Decision rule: if ratio <= 1, logging WILL drop data once the cache fills: stop and change hardware, compression or topic selection. If ratio > 1, report the ratio; the required margin is a user input, not a constant from this flow.
3. Note that compression in the logger reduces bytes written but costs CPU; the end-to-end check is `dlog-drop-audit`.

### Output
`disk_throughput`.

### Quality Gate
- `disk_throughput` contains burst, sustained, drop time, temperature before and after, and the ratio.

---

## Worked Example

Illustrative. `/data` on an NVMe drive, total sensor rate 23.6 MB/s.
```
$ fio --name=seqwrite --filename=/data/fio.test --rw=write --bs=1M --size=400G \
      --direct=1 --ioengine=libaio --iodepth=16 --runtime=900 --time_based \
      --write_bw_log=seqwrite --log_avg_msec=1000 --group_reporting
  WRITE: bw=1480MiB/s ...
$ awk -F, '$1>120000 {s+=$2; n++} END {print s/n " KiB/s"}' seqwrite_bw.1.log
512000 KiB/s
```
Burst about 2.9 GB/s for the first two minutes, sustained about 524 MB/s after the cache filled. Ratio about 22.

---

## Exit Criteria

DONE when sustained bandwidth beyond the cache is measured and compared to the measured total sensor rate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Not enough free space for the test | **Stop**: offload or use a smaller size and report that the cache may not have been exhausted. |
| Phase 2 | `--direct=1` rejected by the filesystem | **Adjust**: drop `--direct=1` and add `--end_fsync=1`; report that page cache was involved. |
| Phase 2 | No visible drop in bandwidth | **Retry**: extend `--runtime`; if still flat, report sustained equals burst for that test length. |
| Phase 3 | Ratio <= 1 | **Return**: report that the disk cannot sustain the sensor rate; do not proceed to recording. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
