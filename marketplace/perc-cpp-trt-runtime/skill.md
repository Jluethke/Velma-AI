# Perception TensorRT Inference Runtime in C++

**One-line description:** Loads a serialized TensorRT engine with the C++ `nvinfer1` API, binds tensors by name with `setTensorAddress`, enqueues with `enqueueV3` on the same CUDA stream as the preprocessing kernel, manages object lifetimes correctly, and verifies outputs against golden tensors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fp16_engine` (string, required): FP16 engine path.
- `int8_engine` (string, optional): INT8 engine path, when built.
- `cpp_preprocess_impl` (object, required): The verified CUDA preprocessing library.

---

## Outputs

- `cpp_inference_impl` (object): Source paths (`trt_runner.h`, `trt_runner.cpp`), CMake target, golden parity per engine, and measured time per call.

---

## Phase 1: Load the Engine

### Entry Criteria
- TensorRT headers and libraries of the same version that built the engine are installed; record `NV_TENSORRT_MAJOR`, `NV_TENSORRT_MINOR` from `NvInferVersion.h`.

### Actions
1. Implement a logger: `class Logger : public nvinfer1::ILogger { void log(Severity s, const char* msg) noexcept override { if (s <= Severity::kWARNING) std::cerr << msg << "\n"; } };`
2. Read the engine file into a `std::vector<char>`. Create `nvinfer1::IRuntime* rt = nvinfer1::createInferRuntime(logger)` and `nvinfer1::ICudaEngine* eng = rt->deserializeCudaEngine(buf.data(), buf.size())` (two-argument form in TensorRT 10; older versions take a third plugin factory argument, check your header).
3. If the engine contains plugins (for example the EfficientNMS plugin), call `initLibNvInferPlugins(&logger, "")` from `NvInferPlugin.h` before deserializing and link `nvinfer_plugin`.
4. Lifetime: in TensorRT 8 and later, release objects with `delete` (or `std::unique_ptr`) in reverse order: context, engine, runtime. `destroy()` is deprecated or removed; do not call it.
5. CMake: `find_package(CUDAToolkit REQUIRED)`; link `nvinfer`, `nvinfer_plugin` and `CUDA::cudart`; add the TensorRT include directory.

### Output
A runner that owns runtime, engine and context.

### Quality Gate
- `deserializeCudaEngine` returns non-null and the logger prints no error.
- The binary runs clean under `compute-sanitizer --tool memcheck` for one inference.

---

## Phase 2: Bind and Enqueue

### Entry Criteria
- Engine loaded.

### Actions
1. Enumerate I/O: `for (int i = 0; i < eng->getNbIOTensors(); ++i) { const char* n = eng->getIOTensorName(i); auto mode = eng->getTensorIOMode(n); auto dims = eng->getTensorShape(n); auto dt = eng->getTensorDataType(n); }`
2. For dynamic shapes call `ctx->setInputShape(name, dims)` before reading output shapes with `ctx->getTensorShape(name)`.
3. `cudaMalloc` one device buffer per tensor at startup, sized from dims and dtype. Bind with `ctx->setTensorAddress(name, ptr)`.
4. Per frame: launch the preprocessing kernel writing directly into the input buffer, then `ctx->enqueueV3(stream)` on the same stream, then `cudaMemcpyAsync` outputs to pinned host memory and `cudaStreamSynchronize(stream)` only when the host needs them.
5. Check the `bool` from `enqueueV3` and every CUDA return code.
6. Do NOT allocate device memory per frame.

### Output
A working per-frame `infer()` call.

### Quality Gate
- 1000 consecutive calls run with zero CUDA errors and constant process memory (`nvidia-smi --query-compute-apps=used_memory --format=csv` before and after).

---

## Phase 3: Golden Parity and Timing

### Entry Criteria
- `infer()` works.

### Actions
1. Feed each golden image through preprocessing and inference; compare decoded detections after NMS with the golden ONNX result (box count, IoU, class), using the user tolerance.
2. Time preprocessing plus inference with `cudaEventRecord` pairs on the stream; report median and p99 after warm-up, per engine.

### Output
`cpp_inference_impl`.

### Quality Gate
- Post-NMS comparison printed per golden image per engine.
- Median and p99 time printed per engine.

---

## Worked Example

Illustrative only. TensorRT 10.3, engine with I/O `images` (kFLOAT, 1x3x640x640) and `output0` (kFLOAT, 1x7x8400). 1000 calls, GPU memory constant at 412 MiB. FP16 parity: 7 of 7 boxes, min IoU 0.991. Preprocess plus inference median 2.48 ms, p99 2.71 ms.

---

## Exit Criteria

DONE when the C++ runner binds all tensors by name, enqueues on the shared stream without per-frame allocation, matches golden detections, passes memcheck, and is timed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Null engine, log says version mismatch | **Stop**: rebuild the engine on the target with the installed TensorRT. |
| Phase 1 | Plugin creator not found | **Adjust**: call `initLibNvInferPlugins` before deserialize and link `nvinfer_plugin`. |
| Phase 2 | `enqueueV3` returns false | **Return** the logger output; check unbound tensors and input shapes. |
| Phase 2 | Memory grows per frame | **Stop**: find the per-frame allocation and move it to startup. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
