# Edge Python: TensorRT Engine Inference Runtime

**One-line description:** Writes and verifies a Python inference loop that deserializes a cached TensorRT engine, binds input and output tensors by name with the TensorRT 10 tensor API, runs `execute_async_v3` on a CUDA stream, and checks its outputs against the accuracy reference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `engine_file` (object, required): Output of `edge-trtexec-engine-build`, loaded through the key procedure from `edge-trt-engine-cache-key`.
- `python_env_report` (object, required): Output of `edge-py-pytorch-aarch64-wheel`; supplies the virtual environment with torch and the system `tensorrt` bindings.

---

## Outputs

- `inference_app` (object): Path to the inference script, the command that starts it, its I/O tensor table (name, mode, dtype, shape), measured per-call latency from a short run, and the output comparison against reference outputs.

---

## Phase 1: Inspect the Engine

### Entry Criteria
- `python -c "import tensorrt"` succeeds in the venv from `python_env_report`.

### Actions
1. Check the TensorRT major version: `python -c "import tensorrt as trt; print(trt.__version__)"`. This flow uses the TensorRT 10 tensor API (`num_io_tensors`, `set_tensor_address`, `execute_async_v3`). For TensorRT 8.x, read that version's Python API docs; the binding-index API differs.
2. List tensors:
   ```
   import tensorrt as trt
   logger = trt.Logger(trt.Logger.WARNING)
   with open(path, "rb") as f:
       engine = trt.Runtime(logger).deserialize_cuda_engine(f.read())
   assert engine is not None, "deserialize failed: rebuild for this device"
   for i in range(engine.num_io_tensors):
       n = engine.get_tensor_name(i)
       print(n, engine.get_tensor_mode(n), engine.get_tensor_dtype(n), engine.get_tensor_shape(n))
   ```
3. Record the table. A `-1` in a shape is a dynamic dimension set at runtime.

### Output
I/O tensor table.

### Quality Gate
- `engine` is not `None`.
- Every tensor has a mode of `TensorIOMode.INPUT` or `TensorIOMode.OUTPUT` recorded.

---

## Phase 2: Write the Loop

### Entry Criteria
- Tensor table exists.

### Actions
1. Allocate device buffers with torch (already present and CUDA-enabled): `torch.empty(shape, dtype=<torch dtype matching trt dtype>, device="cuda")`. Map `trt.float32` to `torch.float32`, `trt.float16` to `torch.float16`, `trt.int32` to `torch.int32`.
2. Create once, outside the loop: `context = engine.create_execution_context()` and `stream = torch.cuda.Stream()`.
3. Per call:
   - `context.set_input_shape(name, shape)` for each dynamic input.
   - `context.set_tensor_address(name, tensor.data_ptr())` for every input and output.
   - `context.execute_async_v3(stream.cuda_stream)`.
   - `stream.synchronize()` before reading outputs.
4. Copy each input into its pre-allocated buffer with `buf.copy_(src, non_blocking=True)` instead of allocating new tensors per frame.
5. Keep preprocessing identical to the code used for `eval_data` in the accuracy check.

Do NOT: create a new execution context or allocate output buffers per frame; both add latency and memory churn on a shared-memory device.

### Output
Inference script.

### Quality Gate
- `python -m py_compile <script>` exits 0.
- The script contains exactly one `create_execution_context` call outside the per-frame function (`grep -n create_execution_context <script>`).

---

## Phase 3: Verify

### Entry Criteria
- Script compiles.

### Actions
1. Run it on the saved reference inputs from `edge-quantization-accuracy-check` and compare to `ref_outputs.json` with the same tolerance used there.
2. Time 200 calls after 50 warm-up calls with `time.perf_counter()` around call plus synchronize. Record median and maximum.
3. Assemble `inference_app` with the start command, for example `~/venvs/edge/bin/python /opt/edge-app/infer.py --engine /opt/edge-models/current/model.engine`.

### Output
`inference_app`.

### Quality Gate
- Output comparison is within the accuracy tolerance.
- Median and maximum per-call latency are recorded from a run, not estimated.

---

## Worked Example

Illustrative only.

```
images TensorIOMode.INPUT DataType.FLOAT (-1, 3, 640, 640)
output TensorIOMode.OUTPUT DataType.FLOAT (-1, 84, 8400)
$ ~/venvs/edge/bin/python infer.py --engine model.fp16.engine --check ref_outputs.json
max_abs_err=0.0032 within atol
median_ms=7.9 max_ms=11.4 (batch 1, 200 calls)
```

---

## Exit Criteria

DONE when the script loads the engine, matches reference outputs within tolerance, and has measured latency.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `deserialize_cuda_engine` returns `None` | **Return**: to `edge-trt-engine-cache-key`; rebuild for this device and TensorRT version. |
| Phase 2 | `AttributeError` on `execute_async_v3` | **Adjust**: TensorRT is older than 10; use the API from that version's docs. |
| Phase 3 | Outputs all zero | **Adjust**: a tensor address is unset or `synchronize` is missing; check each `set_tensor_address` call. |
| Phase 3 | Outputs differ beyond tolerance | **Adjust**: compare preprocessing with the accuracy check code line by line. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
