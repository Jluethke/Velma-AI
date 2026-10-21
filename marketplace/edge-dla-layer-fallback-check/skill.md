# Edge DLA Layer Fallback Check

**One-line description:** Determines whether the Jetson module has Deep Learning Accelerator cores, builds the model for a DLA core with GPU fallback, and reports which layers ran on DLA versus GPU from the trtexec verbose log and exported layer information, so the user knows the real DLA coverage before relying on it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `onnx_model` (object, required): Output of `edge-onnx-export-validate`.
- `dla_core` (integer, optional): DLA core index to test. Defaults to 0 when the device has DLA.

---

## Outputs

- `dla_layer_report` (object): Whether DLA exists on this module and how that was determined, the layer lists on DLA and on GPU, the count of reformat layers inserted at DLA and GPU boundaries, and the trtexec throughput for GPU-only versus DLA-with-fallback.

---

## Phase 1: Confirm DLA Exists

### Entry Criteria
- `onnx_model` is on the device.

### Actions
1. Read the module's data sheet from NVIDIA for the number of DLA cores. Record the document and table.
2. Confirm on the device: `python3 -c "import tensorrt as trt; b=trt.Builder(trt.Logger()); print(b.num_DLA_cores)"`. Record the number.
3. If the count is 0, emit `dla_layer_report` with "no DLA on this module" and stop. This is common; not every Jetson-class module includes DLA.

### Output
DLA core count.

### Quality Gate
- `num_DLA_cores` was printed by the TensorRT builder on this device.
- The data sheet reference is recorded.

---

## Phase 2: Build for DLA

### Entry Criteria
- `num_DLA_cores` is greater than 0 and `dla_core` is less than it.

### Actions
1. Build: `trtexec --onnx=model_folded.onnx --useDLACore=<dla_core> --allowGPUFallback --fp16 --verbose --dumpLayerInfo --exportLayerInfo=layers_dla.json --saveEngine=model.dla.engine 2>&1 | tee dla_build.log`. Check `trtexec --help` for `--dumpLayerInfo` and `--exportLayerInfo`; they exist in recent TensorRT versions only.
2. DLA requires `--fp16` or `--int8`. DLA also supports a restricted layer set and shape limits documented in the "Working with DLA" chapter of the TensorRT Developer Guide; unsupported layers fall back to the GPU only because of `--allowGPUFallback`.
3. Build a GPU-only engine the same way without `--useDLACore` for comparison, or reuse the one from `edge-trtexec-engine-build` if precision matches.

Do NOT: drop `--allowGPUFallback` to "force" DLA; the build fails on the first unsupported layer.

### Output
DLA engine, `dla_build.log`, `layers_dla.json`.

### Quality Gate
- `dla_build.log` ends with the trtexec `PASSED` line.
- `layers_dla.json` exists (or the verbose log has the layer placement section when export is unsupported).

---

## Phase 3: Read the Placement

### Entry Criteria
- DLA build passed.

### Actions
1. In `dla_build.log`, find the section listing layers running on DLA and on GPU (verbose builds print both lists). Count each.
2. Count reformat layers (names containing `Reformat` or `reformatter`) at DLA and GPU boundaries; each crossing copies tensors and adds latency.
3. Benchmark both engines with identical flags: `trtexec --loadEngine=<engine> --useDLACore=<dla_core> --warmUp=500 --duration=30` for DLA and the same without `--useDLACore` for GPU. Record `Throughput` and median latency lines.
4. Assemble `dla_layer_report`.

### Output
`dla_layer_report`.

### Quality Gate
- DLA and GPU layer counts are recorded from the log.
- Both throughput numbers come from runs with the same power mode and clock state.

---

## Worked Example

Illustrative only.

```
$ python3 -c "import tensorrt as trt; b=trt.Builder(trt.Logger()); print(b.num_DLA_cores)"
2
$ grep -c Reformat dla_build.log
6
```
Placement: 118 layers on DLA, 9 on GPU (resize and final concat), 6 reformats. GPU-only throughput higher; DLA path used only to free the GPU for a second model.

---

## Exit Criteria

DONE when the report states DLA presence from the builder, the per-device layer placement, and a like-for-like throughput comparison, or states that the module has no DLA.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `num_DLA_cores` is 0 | **Return**: report no DLA; skip the rest. |
| Phase 2 | Build fails even with fallback | **Adjust**: record the failing layer; try INT8 or static shapes as the DLA chapter suggests. |
| Phase 3 | Layer section absent from log | **Adjust**: use `layers_dla.json`; if neither exists, report coverage as unknown. |
| Phase 3 | More reformats than DLA layers | **Return**: recommend GPU only; boundary copies dominate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
