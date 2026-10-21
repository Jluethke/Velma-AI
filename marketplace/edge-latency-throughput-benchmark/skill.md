# Edge Latency and Throughput Benchmark

**One-line description:** Benchmarks a TensorRT engine on the target device with trtexec under a recorded power mode and clock state, reads throughput, latency percentiles, GPU compute time and transfer times correctly, and runs every configuration enough times to report spread instead of a single number.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `engine_file` (object, required): Output of `edge-trtexec-engine-build`.
- `clock_state` (object, required): Output of `edge-jetson-clocks-lock`.
- `input_shapes` (object, required): Shapes to benchmark; for a dynamic engine, the deployment shape and the max shape.

---

## Outputs

- `benchmark_report` (object): Per configuration (shape, batch, CUDA graph on or off): throughput in qps and inferences per second, latency min, median, mean, 99th percentile and max, GPU compute time, H2D and D2H times, power mode, clock state, maximum temperatures during the run, and the spread across repeated runs.

---

## Phase 1: Fix the Conditions

### Entry Criteria
- `clock_state` exists.

### Actions
1. Record the power mode (`sudo nvpmodel -q`) and clock state (`clock_state` locked or unlocked). Every number in the report carries these two values.
2. Stop other GPU work on the device: `sudo tegrastats --interval 1000` for 5 samples must show `GR3D_FREQ 0%` before starting. If not, find the process with `sudo fuser -v /dev/nvhost* /dev/nvgpu* 2>/dev/null` or `ps aux` and ask the user before stopping it.
3. Start a tegrastats log for the whole benchmark (see `edge-tegrastats-thermal-log`).

### Output
Recorded conditions with an idle GPU.

### Quality Gate
- 5 consecutive tegrastats samples show GPU load 0% before the first run.
- Power mode and clock state are written into the report header.

---

## Phase 2: Run trtexec

### Entry Criteria
- Idle GPU confirmed.

### Actions
1. Base command per configuration:
   `/usr/src/tensorrt/bin/trtexec --loadEngine=model.engine --shapes=images:<batch>x3x640x640 --warmUp=<ms> --duration=<s> --percentile=99 --separateProfileRun 2>&1 | tee bench_<cfg>_<run>.log`
   Take `--warmUp` and `--duration` as user inputs; trtexec's own defaults are printed in `trtexec --help`.
2. Add `--useCudaGraph` as a second configuration; it removes launch overhead and is often what a deployed loop can achieve when shapes are fixed.
3. Add `--noDataTransfers` only as a separate configuration labeled "compute only"; never report it as end-to-end latency.
4. Run each configuration a user-set number of times (at least 2, so spread can be computed) with a user-set idle gap between runs; before each run, confirm from tegrastats that temperatures are back near the idle values recorded in `edge-tegrastats-thermal-log`. Record each run.
5. Check `trtexec --help` for every flag above before use.

### Output
One log per configuration and run.

### Quality Gate
- Each log ends with the trtexec `PASSED` line.
- Each configuration has the recorded number of runs.

---

## Phase 3: Read and Report

### Entry Criteria
- Logs exist.

### Actions
1. From the `=== Performance summary ===` block of each log read:
   - `Throughput: X qps`. One query is one enqueue of the whole batch; inferences per second = qps multiplied by batch size.
   - `Latency: min, max, mean, median, percentile(99%)`. This is end-to-end per query including H2D and D2H when transfers are enabled.
   - `GPU Compute Time:` line, and `H2D Latency` and `D2H Latency` lines.
2. Check the log for the trtexec warning that results may be unstable or that throughput is limited by host or enqueue time; record any such line.
3. For each metric, report median across runs and min to max spread.
4. Attach the maximum temperatures and any throttle samples from the tegrastats log for the window.
5. Assemble `benchmark_report`.

Do NOT: compare numbers measured under different power modes, clock states or shapes in one table without labeling them.

### Output
`benchmark_report`.

### Quality Gate
- Every reported number cites the log file it came from.
- Inferences per second equals qps times batch size for each row.

---

## Worked Example

Illustrative only.

```
$ trtexec --loadEngine=model.fp16.engine --shapes=images:4x3x640x640 --warmUp=2000 --duration=30 --percentile=99 --useCudaGraph
=== Performance summary ===
[I] Throughput: 61.84 qps
[I] Latency: min = 15.91 ms, max = 17.63 ms, mean = 16.16 ms, median = 16.12 ms, percentile(99%) = 16.98 ms
[I] GPU Compute Time: min = 15.22 ms, max = 16.84 ms, mean = 15.49 ms, median = 15.46 ms, percentile(99%) = 16.31 ms
```
Batch 4: 247 inferences per second; three runs spread 61.2 to 62.0 qps; MAXN, clocks locked, no throttle samples.

---

## Exit Criteria

DONE when every configuration has repeated runs reduced to median and spread, with power mode, clock state and thermal context attached.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | GPU not idle | **Stop**: never benchmark with unknown concurrent load. |
| Phase 2 | Shape outside the engine profile | **Adjust**: use shapes within min and max from the build. |
| Phase 3 | Spread across runs exceeds the user's stated spread limit | **Retry**: lengthen `--duration`; check tegrastats for throttle samples. |
| Phase 3 | Throttle samples during a run | **Return**: discard the run and rerun after cooling or with better cooling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
