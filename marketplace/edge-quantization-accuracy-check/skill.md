# Edge Quantization Accuracy Check

**One-line description:** Measures how much accuracy an FP16 or INT8 TensorRT engine loses against the FP32 ONNX reference, first per output tensor with Polygraphy on fixed inputs and then on the task metric over an evaluation set, and accepts the engine only within the user's stated tolerance.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `onnx_model` (object, required): Output of `edge-onnx-export-validate`; the FP32 reference.
- `engine_file` (object, required): Output of `edge-trtexec-engine-build`.
- `eval_data` (string, required): Path to a labeled evaluation set on the device, preprocessed exactly as at runtime, separate from `calibration_data`.
- `accuracy_tolerance` (object, required): User-set limits, for example `{"metric": "mAP50-95", "max_drop": <value>, "atol": <value>, "rtol": <value>}`. This flow does not choose these values.
- `precision` (string, required): Precision of the engine.

---

## Outputs

- `accuracy_report` (object): Per-output tensor comparison results (max and mean absolute and relative error), task metric for the FP32 reference and the engine, the drop, the tolerance applied, and a PASS or FAIL verdict with the command lines used.

---

## Phase 1: Tensor-Level Comparison

### Entry Criteria
- `engine_file` and `onnx_model` exist on the device.

### Actions
1. Write `data_loader.py` with `load_data()` yielding 10 or more real samples from `eval_data` as `{input_name: array}`.
2. Save reference outputs from ONNX Runtime in FP32: `polygraphy run model_folded.onnx --onnxrt --data-loader-script data_loader.py --save-outputs ref_outputs.json`.
3. Compare the engine against them: `polygraphy run model.<precision>.engine --model-type engine --trt --data-loader-script data_loader.py --load-outputs ref_outputs.json --atol <atol> --rtol <rtol>`.
4. Read the summary per output: Polygraphy prints error statistics (max, mean, median) and `PASSED` or `FAILED` per output, then an overall result line.
5. If an output fails, localize the first diverging layer with `polygraphy run model_folded.onnx --trt --<precision> --onnxrt --trt-outputs mark all --onnx-outputs mark all --data-loader-script data_loader.py` (check `polygraphy run --help` for these flags on your version). Record the first layer whose outputs differ.

### Output
Tensor comparison table.

### Quality Gate
- Each output has max absolute and relative error recorded from Polygraphy output.
- The `atol` and `rtol` used equal `accuracy_tolerance`.

---

## Phase 2: Task-Metric Comparison

### Entry Criteria
- Tensor comparison done (pass or fail; tensor errors alone do not decide task accuracy).

### Actions
1. Run the full `eval_data` through the FP32 ONNX model with ONNX Runtime and through the engine with the same pre- and post-processing code. The only difference allowed between the two runs is the inference backend.
2. Compute the task metric with a standard implementation (for example `pycocotools` COCOeval for detection mAP, or top-1 accuracy for classification).
3. Drop = reference metric minus engine metric.

Do NOT: shrink `eval_data`, change thresholds such as NMS IoU between runs, or remove hard samples to make the drop smaller.

### Output
Reference metric, engine metric, drop.

### Quality Gate
- Both runs report the same number of evaluated samples.
- The metric implementation and version are recorded.

---

## Phase 3: Verdict

### Entry Criteria
- Both comparisons finished.

### Actions
1. Verdict table:

| Condition | Verdict |
|---|---|
| Drop at or below `max_drop` | PASS |
| Drop above `max_drop`, `precision` is `int8` | FAIL; retry with more or better calibration data, or FP16 for the diverging layers per the TensorRT docs on per-layer precision |
| Drop above `max_drop`, `precision` is `fp16` | FAIL; check FP16 range warnings in the build log; consider FP32 for flagged layers |

2. Assemble `accuracy_report`.

### Output
`accuracy_report`.

### Quality Gate
- The verdict follows the table from the recorded drop and tolerance.
- `accuracy_report` contains every command line used.

---

## Worked Example

Illustrative only.

```
$ polygraphy run model.int8.engine --model-type engine --trt --data-loader-script data_loader.py --load-outputs ref_outputs.json --atol 0.05 --rtol 0.05
[I] Comparing Output: 'output' ...
[I]     Error Metrics: output
[I]         Absolute Difference | Stats: mean=0.0041, median=0.0019, max=0.118
[E]         FAILED | Output: 'output' | Difference exceeds tolerance (rel=0.05, abs=0.05)
```
Task metric: FP32 0.512, INT8 0.507, drop 0.005 against a user `max_drop` of 0.01: PASS. Tensor failure noted; the task metric decides.

---

## Exit Criteria

DONE when the engine has a tensor-level comparison and a task-metric drop measured on the same evaluation set, with a verdict against the user's tolerance.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `accuracy_tolerance` missing | **Stop**: ask the user; never default a tolerance. |
| Phase 1 | Engine fails to load on this device | **Return**: to `edge-trt-engine-cache-key`; rebuild for this device. |
| Phase 2 | Sample counts differ between runs | **Stop**: fix the loader; the comparison is invalid. |
| Phase 3 | FAIL verdict | **Return**: to `edge-int8-calibration-cache` or `edge-trtexec-engine-build` with the diverging layer named. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
