# Perception Pipeline Profiling with Nsight Systems and NVTX

**One-line description:** Annotates each pipeline stage (decode, upload, preprocess, inference, postprocess, tracking, fusion) with NVTX ranges in Python or C++, captures a timeline with `nsys profile`, and reads `nsys stats` reports to find serialization, synchronization stalls and host-device copies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pipeline_entrypoint` (string, required): The command that runs the full pipeline on recorded data (for example `python run_pipeline.py --input log_dir` or `./build/perc_pipeline log_dir`).
- `stack` (string, required): "python" or "cpp".
- `py_inference_impl` (object, optional): Python runner, when `stack` is "python".
- `cpp_inference_impl` (object, optional): C++ runner, when `stack` is "cpp".

---

## Outputs

- `nsys_report` (object): Path to the `.nsys-rep` file, the NVTX range summary per stage, top CUDA kernels by time, CUDA API calls by time (especially synchronize and memcpy), and a list of findings each tied to a report line.

---

## Phase 1: Add NVTX Ranges

### Entry Criteria
- The pipeline runs end to end on recorded data on the target GPU.
- `nsys --version` prints a version; record it.

### Actions
1. Python: `pip install nvtx`, then wrap each stage: `with nvtx.annotate("preprocess", color="blue"): ...`. Alternatively `torch.cuda.nvtx.range_push("preprocess")` and `range_pop()`.
2. C++: include `<nvtx3/nvToolsExt.h>` (header-only NVTX3, shipped with the CUDA toolkit) and call `nvtxRangePushA("preprocess")` / `nvtxRangePop()` around each stage.
3. Name ranges exactly: `decode`, `upload`, `preprocess`, `infer`, `postprocess`, `track`, `fuse`, `frame` (outer). Same names in both stacks so reports compare.
4. NVTX ranges mark host time. GPU work launched inside a range may run later; Nsight Systems shows the projection onto the GPU row.

### Output
Annotated pipeline.

### Quality Gate
- The pipeline still produces identical outputs on five frames (diff of output files is empty).

---

## Phase 2: Capture

### Entry Criteria
- Annotation done.

### Actions
1. `nsys profile -t cuda,nvtx,osrt --cuda-memory-usage=false -o perc_profile --force-overwrite true <pipeline_entrypoint>`. Add `--capture-range=nvtx --nvtx-capture=<range>` only if you need to skip startup; check `nsys profile --help` for the exact option form in your version.
2. Profile a run long enough to include warm-up and steady state; record the frame count.
3. Do NOT profile a Debug build or with `CUDA_LAUNCH_BLOCKING=1` set; both distort timing.

### Output
`perc_profile.nsys-rep`.

### Quality Gate
- The `.nsys-rep` file exists and `nsys stats` can open it.

---

## Phase 3: Read the Reports

### Entry Criteria
- Report captured.

### Actions
1. List report names for your version: `nsys stats --help-reports`. Recent versions use `nvtx_sum`, `cuda_gpu_kern_sum`, `cuda_api_sum`, `cuda_gpu_mem_time_sum`; older versions use `nvtxsum`, `gpukernsum`, `cudaapisum`.
2. Run `nsys stats --report nvtx_sum,cuda_gpu_kern_sum,cuda_api_sum,cuda_gpu_mem_time_sum perc_profile.nsys-rep`.
3. Read and record:
   - `nvtx_sum`: median and max per stage; the stage with the largest median is the first target.
   - `cuda_api_sum`: large total time in `cudaStreamSynchronize`, `cudaDeviceSynchronize` or `cudaMemcpy` (non-async) means the host waits; find who calls it.
   - `cuda_gpu_mem_time_sum`: Host-to-Device size per frame; large repeated copies mean data leaves the GPU between stages.
   - `cuda_gpu_kern_sum`: top kernels; TensorRT kernels should dominate `infer`.
4. Open the timeline in the Nsight Systems GUI and check whether the GPU row has gaps between `preprocess` and `infer`; gaps mean the host is the bottleneck.
5. Write each finding as: report, line, number, meaning. No finding without a report line.

### Output
`nsys_report`.

### Quality Gate
- Per-stage median and max from `nvtx_sum` are in the report for every named stage.
- Every finding cites a report and a value.

---

## Worked Example

Illustrative only. Python stack, 2000 frames. `nvtx_sum`: decode median 4.8 ms, preprocess 0.4, infer 2.4, postprocess 0.4, track 0.6, frame 9.1. `cuda_api_sum`: `cudaStreamSynchronize` 31% of API time, called after preprocess. Finding: an extra `.cpu()` in preprocess forces a sync; removing it is a candidate change, to be remeasured.

---

## Exit Criteria

DONE when every stage has NVTX statistics from a captured profile and each finding cites a specific report value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Outputs change after annotation | **Stop**: an annotation altered control flow; fix before profiling. |
| Phase 2 | `nsys` cannot trace CUDA | **Return** driver and nsys versions; check the support matrix. |
| Phase 3 | Unknown report name | **Adjust** using `nsys stats --help-reports` and **Retry**. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
