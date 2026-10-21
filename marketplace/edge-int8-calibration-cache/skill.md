# Edge INT8 Calibration Cache

**One-line description:** Generates a TensorRT INT8 calibration cache from a representative data set with Polygraphy or the TensorRT Python entropy calibrator, and blocks the common mistake of building an INT8 engine with trtexec and no cache, which calibrates on random data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `onnx_model` (object, required): Output of `edge-onnx-export-validate`.
- `calibration_data` (string, required): Directory of preprocessed input samples (for example `.npy` files) drawn from the deployment distribution, already resized and normalized exactly as the runtime will do it.
- `precision` (string, required): `fp32`, `fp16` or `int8`. This flow acts only when it is `int8`.

---

## Outputs

- `calibration_cache` (object): Path to the calibration cache file, its sha256, the calibrator algorithm, the number of samples and batch size used, the TensorRT version that wrote it, and whether the model instead uses explicit Q/DQ quantization (in which case no cache is needed).

---

## Phase 1: Choose the Quantization Path

### Entry Criteria
- `precision` is `int8`. If not, emit `calibration_cache` with path `none` and stop.

### Actions
1. Check the graph for explicit quantization: `polygraphy inspect model <onnx> --show layers | grep -c -E 'QuantizeLinear|DequantizeLinear'`.
2. Decide:

| Graph content | Path |
|---|---|
| Q/DQ nodes present | Explicit quantization. TensorRT uses the scales in the graph. No calibration cache. Skip to Phase 3 and record "explicit Q/DQ". |
| No Q/DQ nodes | Implicit (post-training) calibration with a cache. Continue. |

3. Read the release notes of the installed TensorRT version for the status of implicit INT8 calibration. Recent releases mark it deprecated in favor of explicit Q/DQ produced by NVIDIA's TensorRT Model Optimizer. Record what the notes say for your version.

### Output
Quantization path decision.

### Quality Gate
- The Q/DQ node count is recorded.
- The decision row is cited.

---

## Phase 2: Generate the Cache

### Entry Criteria
- Implicit calibration path chosen.

### Actions
1. Count samples: `ls <calibration_data> | wc -l`. The NVIDIA TensorRT Developer Guide discussion of INT8 calibration recommends a representative set; take the sample count as a user input and record it.
2. Write a Polygraphy data loader script `calib_loader.py` that defines `load_data()` yielding dicts `{input_name: numpy_array}` with the exact input names from `onnx_model` and the opt shape.
3. Run on the target device (the cache is tied to the TensorRT version):
   `polygraphy convert <onnx> --int8 --data-loader-script calib_loader.py --calibration-cache calib.cache -o model.int8.engine`
   Polygraphy uses an entropy calibrator by default; record the algorithm it logs.
4. Alternative without Polygraphy: subclass `trt.IInt8EntropyCalibrator2` in Python, implementing `get_batch_size`, `get_batch`, `read_calibration_cache` and `write_calibration_cache`, and attach it with `config.int8_calibrator`.

Do NOT: run `trtexec --int8` without `--calib=<cache>` and treat the result as accurate. Without a cache, trtexec uses placeholder dynamic ranges; that engine is valid for speed measurement only.

### Output
`calib.cache`.

### Quality Gate
- `calib.cache` exists with non-zero size.
- The log shows the calibrator consumed the recorded number of batches.

---

## Phase 3: Record and Bind

### Entry Criteria
- Cache exists or explicit Q/DQ recorded.

### Actions
1. `sha256sum calib.cache` and record it.
2. Record the TensorRT version from `python3 -c "import tensorrt; print(tensorrt.__version__)"`. A cache from another TensorRT version must be regenerated.
3. Note that the downstream engine build uses `--int8 --calib=calib.cache` (add `--fp16` too so layers that do not benefit from INT8 can fall back to FP16).
4. Assemble `calibration_cache`.

### Output
`calibration_cache`.

### Quality Gate
- `calibration_cache` records the sha256 and TensorRT version.
- The path is `none` only when `precision` is not `int8` or the graph is explicit Q/DQ.

---

## Worked Example

Illustrative only.

Input: 500 `.npy` images, `precision` = `int8`.
```
$ polygraphy inspect model model_folded.onnx --show layers | grep -c -E 'QuantizeLinear|DequantizeLinear'
0
$ polygraphy convert model_folded.onnx --int8 --data-loader-script calib_loader.py --calibration-cache calib.cache -o model.int8.engine
[I] Building engine with configuration: ... Flags | [INT8] Calibrator | Calibrator(...)
[I] Saving calibration cache to calib.cache
```

---

## Exit Criteria

DONE when an INT8 deployment has either a cache generated from real samples on the target TensorRT version, or a confirmed explicit Q/DQ graph.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `precision` not `int8` | **Return**: emit `none` and continue the chain. |
| Phase 2 | Loader shape or name mismatch error | **Adjust**: use the exact names and opt shape from `onnx_model`. |
| Phase 2 | Calibration data preprocessed differently from runtime | **Stop**: regenerate the samples with the runtime preprocessing; a mismatched cache gives wrong scales. |
| Phase 3 | TensorRT version changed since calibration | **Retry**: regenerate the cache on the new version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
