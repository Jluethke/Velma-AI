# Edge C++: TensorRT Engine Inference Runtime

**One-line description:** Writes and verifies a C++ inference loop that deserializes a cached TensorRT engine with `nvinfer1::IRuntime`, binds tensors by name, runs `enqueueV3` on a CUDA stream with pre-allocated device buffers, and checks results and errors on every CUDA call.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `engine_file` (object, required): Output of `edge-trtexec-engine-build`, loaded through the key procedure from `edge-trt-engine-cache-key`.
- `cmake_build_report` (object, required): Output of `edge-cpp-cmake-cuda-arch-build`; supplies a working CMake project linked to `nvinfer` and `CUDA::cudart`.

---

## Outputs

- `inference_app` (object): Path to the built binary, the command that starts it, its I/O tensor table, the output comparison against reference outputs, and measured per-call latency.

---

## Phase 1: Load the Engine

### Entry Criteria
- `cmake_build_report` shows a successful build with `NvInfer.h` found.

### Actions
1. Implement a logger: a class deriving from `nvinfer1::ILogger` overriding `void log(Severity severity, const char* msg) noexcept`, printing messages at `Severity::kWARNING` and above.
2. Read the engine file into a `std::vector<char>`.
3. `std::unique_ptr<nvinfer1::IRuntime> runtime{nvinfer1::createInferRuntime(logger)};`
4. `std::unique_ptr<nvinfer1::ICudaEngine> engine{runtime->deserializeCudaEngine(data.data(), data.size())};`. If `engine` is null, exit with a distinct code that the service maps to "rebuild engine".
5. In TensorRT 10, objects are released with `delete` (so `std::unique_ptr` default deleters are correct); `destroy()` was removed. For TensorRT 8.x read that version's API docs.
6. Enumerate tensors with `engine->getNbIOTensors()`, `getIOTensorName(i)`, `getTensorIOMode(name)`, `getTensorDataType(name)`, `getTensorShape(name)` and print the table.

### Output
Loaded engine and tensor table.

### Quality Gate
- The binary prints the tensor table and exits 0 when given the engine.
- A deliberately truncated engine file makes it exit with the rebuild code, not crash.

---

## Phase 2: Write the Loop

### Entry Criteria
- Engine loads.

### Actions
1. Create once: `context` via `engine->createExecutionContext()`, a stream via `cudaStreamCreate(&stream)`.
2. Allocate device buffers once with `cudaMalloc` for the max profile shape. Wrap every CUDA call in a check macro that prints `cudaGetErrorString(err)` with file and line and returns an error.
3. Per frame:
   - `context->setInputShape(name, dims)` for dynamic inputs.
   - `context->setTensorAddress(name, ptr)` for all I/O tensors.
   - `cudaMemcpyAsync` inputs host to device on `stream`.
   - `bool ok = context->enqueueV3(stream);` and treat `false` as an error.
   - `cudaMemcpyAsync` outputs device to host, then `cudaStreamSynchronize(stream)`.
4. Use pinned host buffers (`cudaMallocHost`) for the host side of async copies; pageable memory makes `cudaMemcpyAsync` behave synchronously.
5. On Jetson, host and device share DRAM; zero-copy with `cudaHostAlloc(..., cudaHostAllocMapped)` and `cudaHostGetDevicePointer` can remove the copies. Measure both before choosing; record which one is used.

Do NOT: ignore the return value of `enqueueV3` or of any CUDA call.

### Output
Inference source compiled into the binary.

### Quality Gate
- `grep -c enqueueV3 <source>` matches a line whose return value is checked.
- Build exits 0 with no new warnings in the build log.

---

## Phase 3: Verify

### Entry Criteria
- Binary built.

### Actions
1. Run it on the saved reference inputs from `edge-quantization-accuracy-check` and compare outputs with the same tolerance.
2. Run under `compute-sanitizer --tool memcheck ./edge_infer <args>` for a few frames (compute-sanitizer ships with the CUDA toolkit at `/usr/local/cuda/bin/compute-sanitizer`). It must report `ERROR SUMMARY: 0 errors`.
3. Time 200 frames after 50 warm-up frames with `std::chrono::steady_clock`. Record median and maximum.
4. Assemble `inference_app`.

### Output
`inference_app`.

### Quality Gate
- `compute-sanitizer` prints `ERROR SUMMARY: 0 errors`.
- Output comparison is within tolerance.

---

## Worked Example

Illustrative only.

```
$ ./edge_infer --engine model.fp16.engine --check ref_inputs.bin ref_outputs.bin
images INPUT FLOAT [-1,3,640,640]
output OUTPUT FLOAT [-1,84,8400]
max_abs_err=0.0031 within atol
median_ms=7.4 max_ms=10.9
$ compute-sanitizer --tool memcheck ./edge_infer --engine model.fp16.engine --frames 5
========= ERROR SUMMARY: 0 errors
```

---

## Exit Criteria

DONE when the binary matches reference outputs, passes memcheck, and has measured latency.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Null engine | **Return**: to `edge-trt-engine-cache-key`; rebuild on this device. |
| Phase 1 | Link error for `createInferRuntime_INTERNAL` | **Adjust**: link `nvinfer` as listed in `edge-cpp-cmake-cuda-arch-build`. |
| Phase 2 | `enqueueV3` returns false | **Adjust**: an address or input shape is unset; log each name before enqueue. |
| Phase 3 | memcheck reports an invalid read | **Stop**: fix the buffer size for the max profile shape before measuring anything. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
