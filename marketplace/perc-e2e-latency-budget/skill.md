# Perception End-to-End Latency Budget Measurement

**One-line description:** Measures perception latency from sensor capture timestamp to published result per frame on the target hardware, with per-stage breakdown, warm-up excluded, percentiles reported, and a pass or fail against the user's latency budget, using recorded data replay or a bench setup.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pipeline_entrypoint` (string, required): Command that runs the full pipeline on recorded data.
- `nsys_report` (object, required): Stage names and profile findings.
- `trtexec_report` (object, required): Inference-only timing for comparison.
- `latency_budget_ms` (number, required): End-to-end budget from capture to published result, from the user or system requirement, with whether it applies at p99 or max.
- `sample_count` (number, required): Number of frames to measure after warm-up, chosen by the user.

---

## Outputs

- `latency_report` (object): Per stage and end to end: median, p90, p99, max; frame drop count; clock sources; hardware, power mode and software versions.
- `budget_verdict` (object): Pass or fail against `latency_budget_ms` at the stated percentile, the measured value, and the top stage contributors.

---

## Phase 1: Define Timestamps and Clocks

### Entry Criteria
- Measurement runs on the target hardware using recorded data replay or a bench camera and lidar. The pipeline output is logged only and is not connected to any actuator.

### Actions
1. Define `t_capture`: the sensor's exposure or sweep timestamp from the driver message header, not the host receive time. Record the clock (PTP, GPS, host monotonic).
2. Define `t_publish`: the moment the result is written to the output (topic, socket or file), taken with a monotonic host clock.
3. If `t_capture` and host clocks differ, measure their offset (PTP status or `chronyc tracking`) and record it; otherwise end-to-end numbers are invalid.
4. For replay, `t_capture` is the time the replayer releases the frame at the recorded rate (the replay rate must equal the sensor rate). Record that this excludes sensor exposure and transport.
5. Per stage, take timestamps at stage boundaries with `time.perf_counter_ns()` or `std::chrono::steady_clock`; for GPU stages, synchronize the stream at the boundary in measurement builds only, or use CUDA events.

### Output
A timestamp plan.

### Quality Gate
- Each timestamp has a named clock and code location, written in the report.

---

## Phase 2: Measure

### Entry Criteria
- Timestamp plan implemented.

### Actions
1. Fix the hardware state: record `nvidia-smi -q -d CLOCK,PERFORMANCE` (discrete GPU) or `nvpmodel -q` and `jetson_clocks --show` (Jetson-class modules).
2. Run with warm-up frames discarded (record the count), then `sample_count` frames at the real sensor rate. Running faster than the sensor rate hides queueing effects; running slower hides contention.
3. Count dropped frames (input frames with no output) separately; a dropped frame is not a fast frame.
4. Compute `numpy.percentile(lat, [50, 90, 99])` and max per stage and end to end.

### Output
Raw latency arrays and percentiles.

### Quality Gate
- `sample_count` samples recorded after warm-up; drop count printed.

---

## Phase 3: Verdict and Breakdown

### Entry Criteria
- Percentiles computed.

### Actions
1. Compare the end-to-end value at the budget's percentile with `latency_budget_ms`. Pass only if it is at or below the budget.
2. Rank stages by their p99 contribution; cross-check the inference stage against `trtexec_report` `Latency` p99. A large gap means overhead outside TensorRT (copies, sync, Python).
3. Write `budget_verdict` with measured value, budget, percentile, top three stages, and drop count.
4. Do NOT report the trtexec number or a mean as the end-to-end latency. Do not exclude slow frames from the percentiles.

### Output
`latency_report`, `budget_verdict`.

### Quality Gate
- Verdict states the percentile, measured value and budget explicitly.
- Stage table sums approximately to end to end; the gap (queueing) is printed.

---

## Worked Example

Illustrative only. Replay at 10 Hz on the target module in a recorded power mode, 100 warm-up frames, `sample_count=5000`. End to end p50 18.2 ms, p99 27.9 ms, max 41.3 ms, 0 drops. Budget 30 ms at p99: pass. Top p99 stages: decode 7.1 ms, infer 3.0 ms (trtexec p99 2.95 ms), fuse 2.2 ms; queueing gap 9.4 ms.

---

## Exit Criteria

DONE when end-to-end and per-stage latency percentiles are measured on target with named clocks, drops counted, and the verdict states the percentile and budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Clocks not synchronized | **Stop**: fix time sync before measuring. |
| Phase 2 | Thermal throttling during run | **Retry** after recording clocks; report throttling if it recurs, since it is part of the real behavior. |
| Phase 3 | Budget fails | **Return** the stage ranking to `perc-nsys-profile-pipeline` and `perc-model-select-pareto`; remeasure after each change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
