# Edge TensorRT Engine Build with trtexec

**One-line description:** Builds a serialized TensorRT engine on the target Jetson device from an ONNX file with trtexec, setting precision, optimization profile shapes, workspace pool, timing cache and optional DLA core, and reads the build log for parser errors, layer fallbacks and the final build result.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device that will run the engine.
- `onnx_model` (object, required): Output of `edge-onnx-export-validate`.
- `input_shapes` (object, required): Min, opt and max shapes per input name.
- `precision` (string, required): `fp32`, `fp16` or `int8`.
- `memory_budget` (object, required): Output of `edge-unified-memory-budget`; supplies the workspace size.
- `calibration_cache` (object, optional): Output of `edge-int8-calibration-cache`; required when `precision` is `int8` and the graph has no Q/DQ nodes.
- `dla_core` (integer, optional): DLA core index to target. Absent means GPU only.

---

## Outputs

- `engine_file` (object): Path to the `.engine` file on the device, its sha256 and size, and the exact trtexec command line that built it.
- `build_log` (object): Path to the full verbose log, the TensorRT version line, warnings counted by type, and the build result line.

---

## Phase 1: Compose the Command

### Entry Criteria
- `onnx_model` and `memory_budget` exist on or are copied to the device.

### Actions
1. Locate trtexec: `ssh <device_host> ls /usr/src/tensorrt/bin/trtexec`. It is not on PATH by default.
2. Run `trtexec --help > trtexec_help.txt` on the device and confirm every flag below appears in it before use. Flags change between TensorRT versions.
3. Compose:
   ```
   /usr/src/tensorrt/bin/trtexec --onnx=model_folded.onnx \
     --saveEngine=model.<precision>.engine \
     --minShapes=images:1x3x640x640 --optShapes=images:4x3x640x640 --maxShapes=images:8x3x640x640 \
     --memPoolSize=workspace:<size from memory_budget> \
     --timingCacheFile=timing.cache \
     --verbose
   ```
4. Precision flags by `precision`:

| `precision` | Flags |
|---|---|
| `fp32` | none |
| `fp16` | `--fp16` |
| `int8` with cache | `--int8 --fp16 --calib=calib.cache` |
| `int8` with Q/DQ graph | `--int8 --fp16` (scales come from the graph) |

5. If `dla_core` is set, add `--useDLACore=<dla_core> --allowGPUFallback` and use `fp16` or `int8` only; DLA does not run FP32.
6. For a model with only static shapes, omit the three shape flags.

### Output
Final command line.

### Quality Gate
- Every flag in the command appears in `trtexec_help.txt`.
- Shape flag names equal the ONNX input names in `onnx_model`.

---

## Phase 2: Build on the Device

### Entry Criteria
- Command composed.

### Actions
1. Set the power mode and clocks as recorded upstream; tactic selection times kernels, so a build under a throttled state can choose slower tactics.
2. Run the command with output saved: `... 2>&1 | tee build.log`.
3. Reuse `timing.cache` on later builds of the same model on the same device and TensorRT version; it shortens build time. Never copy it to a different device type.

Do NOT: build the engine on an x86 workstation or a different Jetson module and copy it here. Engines are specific to the TensorRT version and GPU.

### Output
Engine file and `build.log`.

### Quality Gate
- `build.log` contains a line with `PASSED` for the trtexec run (the final `&&&& PASSED TensorRT.trtexec` line).
- The `.engine` file exists with non-zero size.

---

## Phase 3: Read the Log

### Entry Criteria
- Build finished.

### Actions
1. Record the `TensorRT version:` line near the top.
2. Search `build.log` for: `ERROR`, `Unsupported`, `ModelImporter`, `Some tactics do not have sufficient workspace memory`, `Weights ... are outside of the FP16 range`. For each hit, record the line.
3. Read the line with the build time (`Engine built in` in recent versions).
4. Compute `sha256sum model.<precision>.engine`.
5. Assemble `engine_file` and `build_log`.

### Output
`engine_file`, `build_log`.

### Quality Gate
- `build_log` lists a count for each searched warning class (zero is a valid count).
- `engine_file` includes the full command line and sha256.

---

## Worked Example

Illustrative only.

```
$ /usr/src/tensorrt/bin/trtexec --onnx=model_folded.onnx --saveEngine=model.fp16.engine --fp16 \
   --minShapes=images:1x3x640x640 --optShapes=images:4x3x640x640 --maxShapes=images:8x3x640x640 \
   --memPoolSize=workspace:2048 --timingCacheFile=timing.cache --verbose 2>&1 | tee build.log
[I] TensorRT version: 10.3.0
[I] Engine built in 412.6 sec.
&&&& PASSED TensorRT.trtexec [TensorRT v100300] # /usr/src/tensorrt/bin/trtexec --onnx=...
```
Warnings: 0 unsupported, 2 FP16 range warnings (passed to the accuracy check).

---

## Exit Criteria

DONE when an engine built on the target device exists with its sha256, command line and a classified build log.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A flag missing from `--help` | **Adjust**: use the replacement the help text names; never keep a flag the binary does not list. |
| Phase 2 | Parser error on an op | **Return**: to `edge-onnx-export-validate` with the op name; try another opset or a plugin per NVIDIA docs. |
| Phase 2 | Build killed for memory | **Adjust**: lower the workspace or max shape and rebuild. |
| Phase 2 | `int8` without a cache or Q/DQ | **Stop**: run `edge-int8-calibration-cache` first. |
| Phase 3 | FP16 range warnings | **Adjust**: carry them to `edge-quantization-accuracy-check`; decide precision from measured accuracy. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
