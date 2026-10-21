# Edge DeepStream nvinfer Pipeline

**One-line description:** Builds a DeepStream GStreamer pipeline (decode, nvstreammux, nvinfer, nvvideoconvert, nvdsosd) with an nvinfer config that points at the prebuilt TensorRT engine so it is not rebuilt at every start, and measures per-stream frame rate and component latency.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `engine_file` (object, required): Output of `edge-trtexec-engine-build`.
- `onnx_model` (object, required): Output of `edge-onnx-export-validate`; nvinfer uses it to rebuild only when the engine is missing or incompatible.
- `container_run_spec` (object, required): Output of `edge-container-nvidia-runtime`; DeepStream usually runs in an NVIDIA DeepStream image matching the host L4T release.
- `precision` (string, required): Precision of the engine.

---

## Outputs

- `deepstream_config` (object): Path of the nvinfer config file, the pipeline launch line or deepstream-app config, the DeepStream version, per-stream FPS from a measured run, and component latency lines when latency measurement is enabled.

---

## Phase 1: Check Versions

### Entry Criteria
- A DeepStream installation or image exists for the host L4T release.

### Actions
1. Run `deepstream-app --version-all`. Record DeepStream, CUDA, cuDNN and TensorRT versions it prints.
2. Confirm its TensorRT version equals the one that built `engine_file`. If not, the engine must be rebuilt inside this environment (an engine is tied to its TensorRT version).
3. Run `gst-inspect-1.0 nvinfer` and `gst-inspect-1.0 nvstreammux`. Both must print element details; a "No such element" message means the DeepStream plugins are not on the GStreamer path.

### Output
Version table.

### Quality Gate
- `gst-inspect-1.0 nvinfer` exits 0.
- DeepStream TensorRT version equals the engine's TensorRT version, or a rebuild is recorded.

---

## Phase 2: Write the nvinfer Config

### Entry Criteria
- Versions match or a rebuild is planned.

### Actions
1. Create `pgie_config.txt` with a `[property]` group:
   - `gpu-id=0`
   - `onnx-file=<path to model_folded.onnx>`
   - `model-engine-file=<path to the engine>`
   - `batch-size=<equal to nvstreammux batch-size>`
   - `network-mode=` 0 for FP32, 1 for INT8, 2 for FP16, matching `precision`
   - `int8-calib-file=<calib.cache>` only for INT8 with a cache
   - `num-detected-classes=<n>`, `labelfile-path=<labels.txt>`, `gie-unique-id=1`
   - `net-scale-factor`, `offsets`, `model-color-format` set to the same normalization as the accuracy check preprocessing
   - `parse-bbox-func-name` and `custom-lib-path` when the model output needs a custom parser
2. The engine's max batch size must be at least `batch-size`. If nvinfer finds the engine incompatible, it rebuilds from `onnx-file` and writes a new engine with an auto-generated name; that silent rebuild adds minutes to startup. Check the log for it in Phase 3.
3. Each config key above must appear in the "Gst-nvinfer" section of the DeepStream plugin guide for the installed version; remove any key not listed there.

### Output
`pgie_config.txt`.

### Quality Gate
- `network-mode` matches `precision` per the mapping above.
- `batch-size` in the config equals the nvstreammux `batch-size`.

---

## Phase 3: Run and Measure

### Entry Criteria
- Config written.

### Actions
1. Run a file-based test inside the container from `container_run_spec`:
   `gst-launch-1.0 filesrc location=sample.h264 ! h264parse ! nvv4l2decoder ! m.sink_0 nvstreammux name=m batch-size=1 width=1280 height=720 ! nvinfer config-file-path=pgie_config.txt ! nvvideoconvert ! nvdsosd ! fakesink sync=false`
2. Read the first 100 log lines for an engine rebuild message (nvinfer logs that it is building or serializing an engine). Zero rebuild lines means the cached engine loaded.
3. For FPS, run the same model with `deepstream-app -c app_config.txt` where `[application]` has `enable-perf-measurement=1` and `perf-measurement-interval-sec=5`; it prints `**PERF:` lines with per-stream FPS.
4. For component latency, set `NVDS_ENABLE_COMPONENT_LATENCY_MEASUREMENT=1` and `NVDS_ENABLE_LATENCY_MEASUREMENT=1` before running deepstream-app (check the DeepStream troubleshooting guide for your version's variable names).
5. Assemble `deepstream_config`.

Do NOT: measure with `sync=true` on the sink; it paces output to the stream clock and hides throughput.

### Output
`deepstream_config`.

### Quality Gate
- The run log contains zero engine rebuild lines.
- At least three `**PERF:` lines are recorded.

---

## Worked Example

Illustrative only.

```
$ deepstream-app --version-all
deepstream-app version 7.1.0
DeepStreamSDK 7.1.0
CUDA Driver Version: 12.6 ... TensorRT Version: 10.3
$ deepstream-app -c app_config.txt
**PERF:  FPS 0 (Avg)
**PERF:  118.42 (117.90)
**PERF:  119.03 (118.31)
```

---

## Exit Criteria

DONE when the pipeline loads the prebuilt engine without rebuilding and per-stream FPS is measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | TensorRT version mismatch | **Adjust**: rebuild the engine inside the DeepStream environment with `edge-trtexec-engine-build`. |
| Phase 2 | Engine max batch below `batch-size` | **Return**: rebuild with a larger max shape. |
| Phase 3 | nvinfer rebuilds the engine every start | **Adjust**: point `model-engine-file` at the generated file name nvinfer logged, or fix the incompatibility it reported. |
| Phase 3 | Boxes missing or misplaced | **Adjust**: check `net-scale-factor`, `offsets` and the bbox parser against the accuracy check preprocessing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
