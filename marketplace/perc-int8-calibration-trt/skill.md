# Perception TensorRT INT8 Engine with Calibration

**One-line description:** Builds an INT8 TensorRT engine using post-training calibration over a representative image set drawn from training data (never holdout), with Polygraphy's data loader and entropy calibrator, keeps sensitive output layers in FP16 when measured necessary, and records the calibration cache and build report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `onnx_model` (string, required): Verified ONNX file.
- `preprocess_spec` (object, required): Exact preprocessing; calibration inputs must match it.
- `calibration_dir` (string, required): Folder of calibration images drawn from the training distribution. Must not overlap with holdout.
- `input_shape` (string, required): Deployment shape.
- `gpu_target` (string, required): Deployment GPU and TensorRT version.

---

## Outputs

- `int8_engine` (string): Path to the INT8 engine.
- `calibration_cache` (string): Path to the calibration cache file.
- `int8_build_report` (object): TensorRT version, calibrator type, image count, layers kept in FP16 and why, and the `trtexec` performance summary for the INT8 engine.

---

## Phase 1: Prepare the Calibration Set

### Entry Criteria
- The GPU supports INT8 (check the TensorRT support matrix for its compute capability).
- Read your TensorRT version's developer guide section on quantization first. Recent versions (TensorRT 10) deprecate implicit-quantization calibrators in favor of explicit quantization (Q/DQ nodes, for example from NVIDIA TensorRT Model Optimizer). If your version marks calibration as deprecated, record that and decide with the user whether to continue with it or switch to Q/DQ.

### Actions
1. Confirm zero overlap with holdout: compare file names and perceptual hashes against `holdout_annotations` image list. Overlap makes later accuracy numbers biased.
2. Select images that cover the operating conditions (day, night, rain, tunnel exits). The TensorRT developer guide notes that about 500 images were sufficient for ImageNet classification calibration; treat that as a starting point for a detector, not a rule, and record the count you use.
3. Write `data_loader.py` with a `load_data()` generator that yields `{"images": tensor}` where `tensor` is preprocessed exactly per `preprocess_spec` (same letterbox, color order and scaling), dtype float32, shape `input_shape`.

### Output
`data_loader.py` and the calibration image list.

### Quality Gate
- Overlap count with holdout printed as 0.
- One yielded tensor equals the golden tensor for the same image (max abs diff printed).

---

## Phase 2: Calibrate and Build

### Entry Criteria
- Data loader verified.

### Actions
1. Build with Polygraphy (uses `IInt8EntropyCalibrator2` by default, which the TensorRT guide recommends for CNNs):
   `polygraphy convert model.onnx --int8 --fp16 --data-loader-script data_loader.py --calibration-cache calib.cache -o model_int8.engine`
   `--fp16` alongside `--int8` lets TensorRT fall back to FP16 instead of FP32 for layers without a good INT8 kernel.
2. Alternative with an existing cache: `trtexec --onnx=model.onnx --int8 --fp16 --calib=calib.cache --saveEngine=model_int8.engine --profilingVerbosity=detailed --exportLayerInfo=layers_int8.json`.
3. Regenerate the cache when the TensorRT version, the model or the preprocessing changes.
4. Do NOT calibrate with random tensors. `trtexec --int8` without a cache uses dummy scales meant only for performance testing, and the accuracy is meaningless.

### Output
`model_int8.engine`, `calib.cache`.

### Quality Gate
- The build log shows calibration ran over the stated image count and ends without errors.
- `calib.cache` exists and is non-empty.

---

## Phase 3: Benchmark and Mark Precision Fallbacks

### Entry Criteria
- INT8 engine built.

### Actions
1. Benchmark with the same command and settings as the FP16 flow: `trtexec --loadEngine=model_int8.engine --shapes=images:<input_shape> --useCudaGraph --separateProfileRun`. Record median and p99 `GPU Compute Time`.
2. Accuracy is measured by `perc-detection-map-eval` on holdout for both engines. If the INT8 mAP drop exceeds the user's limit, keep the detection head in FP16: rebuild with `trtexec ... --int8 --fp16 --precisionConstraints=obey --layerPrecisions=<layer_name>:fp16,...` (layer names from `layers_int8.json`; flags exist in TensorRT 8.5 and later, check `--help`).
3. Record every layer forced to FP16 and the measured reason.

### Output
`int8_engine`, `calibration_cache`, `int8_build_report`.

### Quality Gate
- The report has INT8 median and p99 compute time measured with the same flags as FP16.
- Every forced FP16 layer has a recorded reason tied to a holdout measurement.

---

## Worked Example

Illustrative only. 600 training frames across day, dusk, night and rain; 0 overlaps with holdout. Golden check max diff 0.0. `polygraphy convert ... --int8 --fp16` builds in 6 minutes. INT8 GPU Compute median 1.42 ms vs FP16 2.31 ms. Holdout eval later showed AP50-95 drop larger than the user limit; the last three head convolutions were forced to FP16, median became 1.55 ms.

---

## Exit Criteria

DONE when an INT8 engine exists, built from a calibration set that excludes holdout and matches preprocessing, with its cache and performance recorded under the same benchmark flags as FP16.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Calibration images overlap holdout | **Stop**: remove the overlap and **Retry**. |
| Phase 2 | Calibrator API deprecated in this TensorRT version | **Return** to the user with the explicit quantization option. |
| Phase 2 | Cache from another TensorRT version | **Adjust**: delete only your own cache file for this run and recalibrate. |
| Phase 3 | INT8 slower than FP16 | **Return** the layer report; many layers may have fallen back, so INT8 brings no gain on this model. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
