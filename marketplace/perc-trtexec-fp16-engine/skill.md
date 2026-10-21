# Perception TensorRT FP16 Engine with trtexec

**One-line description:** Builds an FP16 TensorRT engine from the ONNX model with `trtexec` on the deployment GPU, saves a timing cache and layer report, and reads the `trtexec` performance summary (GPU Compute Time, H2D and D2H latency, throughput) correctly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `onnx_model` (string, required): Verified ONNX file.
- `input_shape` (string, required): Deployment shape, for example `1x3x640x640`.
- `gpu_target` (string, required): The exact deployment GPU or module and its software stack (driver, CUDA, TensorRT versions). Engines are not portable across GPU models or TensorRT versions.

---

## Outputs

- `fp16_engine` (string): Path to the serialized `.engine` file.
- `trtexec_report` (object): The full command, TensorRT version, the performance summary fields, the layer info JSON path, and the count of layers running in FP32 vs FP16.

---

## Phase 1: Build on the Target

### Entry Criteria
- The build runs on `gpu_target` itself or an identical GPU with identical TensorRT version. Record `trtexec` banner line `TensorRT version` and `nvidia-smi` output.

### Actions
1. Static shape: `trtexec --onnx=model.onnx --saveEngine=model_fp16.engine --fp16 --timingCacheFile=timing.cache --profilingVerbosity=detailed --exportLayerInfo=layers_fp16.json`
2. Dynamic batch: add `--minShapes=images:1x3x640x640 --optShapes=images:<opt> --maxShapes=images:<max>`, with names from the ONNX input and sizes from the user.
3. Workspace: TensorRT 8.4 and later use `--memPoolSize=workspace:<MiB>`; older versions use `--workspace=<MiB>`. Run `trtexec --help` to see which your version accepts. Do not pass both.
4. Note that `--fp16` allows FP16 but TensorRT may keep layers in FP32 when faster or required. That is expected.
5. Keep the full build log: `... 2>&1 | tee build_fp16.log`.

### Output
`model_fp16.engine`, `timing.cache`, `layers_fp16.json`, `build_fp16.log`.

### Quality Gate
- The log ends with `&&&& PASSED TensorRT.trtexec`.
- The engine file exists and is non-empty.

---

## Phase 2: Benchmark and Read the Summary

### Entry Criteria
- Engine built.

### Actions
1. Run `trtexec --loadEngine=model_fp16.engine --shapes=images:<input_shape> --warmUp=<ms> --duration=<s> --useCudaGraph --separateProfileRun 2>&1 | tee bench_fp16.log`. Warm-up and duration are user choices; record them (trtexec defaults apply when omitted; check `--help`).
2. Read these lines from the `Performance summary`:
   - `Throughput: X qps`: inferences per second, at the default single stream.
   - `Latency: min, max, mean, median, percentile(90%), percentile(95%), percentile(99%)`: host-measured end to end of one inference, including H2D and D2H copies.
   - `GPU Compute Time`: kernel time only. This is the number to compare engines with.
   - `H2D Latency` and `D2H Latency`: copy times. Large values mean input data movement, not the model, is the cost.
   - `Enqueue Time`: host launch overhead; CUDA graphs reduce it.
3. Do NOT quote `GPU Compute Time` as the pipeline latency. It excludes decode, preprocessing, postprocessing and tracking.

### Output
Parsed performance numbers.

### Quality Gate
- `trtexec_report` contains median and p99 for both `Latency` and `GPU Compute Time`, with the command used.

---

## Phase 3: Check Layer Precision

### Entry Criteria
- `layers_fp16.json` exists.

### Actions
1. Parse `layers_fp16.json` with `json.load` and count layers by output precision (field names vary by TensorRT version; inspect one entry first).
2. List any layers that stayed FP32 and record them. Do not force them to FP16 unless an accuracy measurement on holdout justifies it later.
3. Optional per-layer timing: `trtexec --loadEngine=model_fp16.engine --dumpProfile --separateProfileRun` and note the five slowest layers.

### Output
`fp16_engine`, `trtexec_report`.

### Quality Gate
- The report lists the FP32 and FP16 layer counts.

---

## Worked Example

Illustrative only. TensorRT 10.3 on an sm_87 module. Build: `&&&& PASSED`. Bench: `Throughput: 412 qps`, `Latency: median = 2.61 ms, percentile(99%) = 2.95 ms`, `GPU Compute Time: median = 2.31 ms, percentile(99%) = 2.52 ms`, `H2D Latency: median = 0.21 ms`. Layers: 241 FP16, 6 FP32 (output decode).

---

## Exit Criteria

DONE when the engine is built on the target stack, its benchmark summary is parsed into median and p99 latency and compute time, and the layer precision split is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ONNX parser error on an op | **Return** the op name; fix at export (opset or graph surgery), not by editing the engine. |
| Phase 1 | Unknown option error | **Adjust** to the flag your version lists in `trtexec --help` and **Retry**. |
| Phase 2 | High variance between runs | **Retry** with the GPU idle and clocks recorded; on Jetson-class modules record the power mode (`nvpmodel -q`). |
| Phase 2 | Engine fails to load on target | **Stop**: rebuild on the target; engines are tied to GPU and TensorRT version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
