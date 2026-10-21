# Perception TensorRT Inference Runtime in Python

**One-line description:** Loads a serialized TensorRT engine with the TensorRT Python API, binds input and output tensors by name to preallocated PyTorch CUDA buffers, runs `execute_async_v3` on one CUDA stream with the GPU preprocessing, and verifies outputs against the golden ONNX outputs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fp16_engine` (string, required): FP16 engine path.
- `int8_engine` (string, optional): INT8 engine path, when built.
- `py_preprocess_impl` (object, required): The verified Python GPU preprocessing.

---

## Outputs

- `py_inference_impl` (object): Module path, the class (`TrtRunner(engine_path).infer(tensor) -> dict[name, tensor]`), golden parity per engine, and measured time per call.

---

## Phase 1: Load and Bind

### Entry Criteria
- `python -c "import tensorrt as trt;print(trt.__version__)"` prints the same version that built the engines.

### Actions
1. `logger = trt.Logger(trt.Logger.WARNING)`; `runtime = trt.Runtime(logger)`; `engine = runtime.deserialize_cuda_engine(open(path,"rb").read())`; `context = engine.create_execution_context()`.
2. Enumerate tensors by name (TensorRT 8.5 and later API): `for i in range(engine.num_io_tensors): name = engine.get_tensor_name(i)`; read `engine.get_tensor_mode(name)` (`trt.TensorIOMode.INPUT` or `OUTPUT`), `engine.get_tensor_dtype(name)` and `engine.get_tensor_shape(name)`.
3. For dynamic shapes call `context.set_input_shape(name, shape)` first, then read output shapes from `context.get_tensor_shape(name)`.
4. Preallocate one `torch.empty(shape, dtype=..., device="cuda")` per tensor at startup, mapping `trt.float32` to `torch.float32` and `trt.float16` to `torch.float16`. Bind with `context.set_tensor_address(name, t.data_ptr())`.
5. Do NOT use the removed binding-index APIs (`get_binding_index`, `execute_async_v2`) on TensorRT 10; they do not exist there.

### Output
A runner class with fixed buffers.

### Quality Gate
- Printing the tensor table shows every I/O name with mode, dtype and shape matching `polygraphy inspect model`.

---

## Phase 2: Run on the Shared Stream

### Entry Criteria
- Runner constructed.

### Actions
1. Create one stream `s = torch.cuda.Stream()` for preprocessing and inference. Write the preprocessed tensor into the bound input buffer with `inp.copy_(x)` inside `with torch.cuda.stream(s):`.
2. Call `context.execute_async_v3(s.cuda_stream)`. It returns `True` on successful enqueue; treat `False` as an error.
3. Synchronize only where the host needs results: `s.synchronize()` before reading outputs on the CPU.
4. One execution context per thread. Do not share a context across threads.

### Output
Inference outputs per call.

### Quality Gate
- 100 consecutive calls return without error and with identical outputs for identical input (print max diff 0 or the engine's documented nondeterminism).

---

## Phase 3: Golden Parity and Timing

### Entry Criteria
- Inference works.

### Actions
1. Feed each `golden_in_<k>.npy` and compare outputs with `golden_out_<k>.npy` from ONNX Runtime. FP16 and INT8 engines differ numerically from FP32; compare detections after NMS (box count, per-box IoU, class) as the acceptance check, with user tolerance.
2. Time preprocessing plus inference with CUDA events over the user's iteration count after warm-up. Report median and p99 per engine.

### Output
`py_inference_impl`.

### Quality Gate
- Post-NMS detection comparison printed per golden image per engine.
- Median and p99 time printed per engine.

---

## Worked Example

Illustrative only. TensorRT 10.3. Tensor table: `images INPUT float32 (1,3,640,640)`, `output0 OUTPUT float32 (1,7,8400)`. FP16 vs golden after NMS: 7 of 7 boxes, min IoU 0.991, same classes. Preprocess plus FP16 inference median 2.92 ms, p99 3.30 ms.

---

## Exit Criteria

DONE when the runner binds every tensor by name, executes on the shared stream, matches golden detections within tolerance for each engine, and is timed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Deserialize returns None | **Stop**: TensorRT version or GPU differs from the build; rebuild on target. |
| Phase 1 | AttributeError on an API name | **Adjust** to the API of the installed version (check its Python API docs). |
| Phase 2 | `execute_async_v3` returns False | **Return** the logger messages; usually an unset input shape or unbound tensor. |
| Phase 3 | Detections differ from golden | **Stop**: check input dtype and preprocessing before blaming precision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
