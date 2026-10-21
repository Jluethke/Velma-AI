# Perception GPU Preprocessing in C++ (CUDA Kernel)

**One-line description:** Implements the recorded preprocessing spec as one fused CUDA kernel (letterbox bilinear resize, pad, BGR to RGB, HWC to CHW, scale to float) launched on the inference stream from C++, and proves it against the golden tensors with a small test binary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `preprocess_spec` (object, required): Spec with golden tensor paths.
- `holdout_annotations` (string, required): Used only to pick extra images for the parity test.

---

## Outputs

- `cpp_preprocess_impl` (object): Source paths (`preprocess.cu`, `preprocess.h`), CMake target name, parity results, and measured kernel time.

---

## Phase 1: Write the Kernel

### Entry Criteria
- `nvcc --version` and `cmake --version` print versions; record both.
- The spec has no open questions.

### Actions
1. Declare `void letterbox_preprocess(const uint8_t* src_bgr, int sw, int sh, int src_pitch, float* dst_chw, int dw, int dh, float r, int pad_x, int pad_y, uint8_t pad_value, cudaStream_t s);` in `preprocess.h`.
2. In `preprocess.cu` launch one thread per output pixel. For an output pixel `(x, y)`: if outside the resized region, write `pad_value / 255.0f` to all three planes. Else map back with the same convention as OpenCV `INTER_LINEAR`: `sx = (x - pad_x + 0.5f) / r - 0.5f`, clamp, bilinear blend of four source pixels, then write R to plane 0, G to plane 1, B to plane 2 at `dst[c*dh*dw + y*dw + x]`, divided by 255.
3. Copy the source image with `cudaMemcpyAsync` from pinned host memory (`cudaMallocHost`) on stream `s`. Pageable memory makes the copy synchronous.
4. Check every CUDA call: wrap in a macro that reads `cudaGetLastError()` after the launch and aborts with the error string.
5. Add a CMake target: `project(perc LANGUAGES CXX CUDA)`, `add_library(perc_pre preprocess.cu)`, `set_target_properties(perc_pre PROPERTIES CUDA_ARCHITECTURES <arch>)` with `<arch>` from the GPU compute capability (`nvidia-smi --query-gpu=compute_cap --format=csv`).

### Output
`preprocess.cu`, `preprocess.h`, `CMakeLists.txt`.

### Quality Gate
- `cmake -S . -B build && cmake --build build` exits 0 with zero warnings from `nvcc` (add `-Xcompiler -Wall`).

---

## Phase 2: Parity Test Binary

### Entry Criteria
- The library builds.

### Actions
1. Write `test_preprocess.cpp` that loads each golden image with `cv::imread`, runs the kernel, copies the result back, and loads `golden_in_<k>.npy` (use the small header-only `cnpy` library, or save the golden tensors as raw `.bin` float32 from Python with `t.tofile()` and read with `std::ifstream`).
2. Print max and mean absolute difference per image.
3. Run the test under `compute-sanitizer --tool memcheck ./build/test_preprocess`; it must report `ERROR SUMMARY: 0 errors`.
4. Do NOT relax the tolerance supplied by the user. If the max difference is above it, print the first differing pixel coordinates and channel; most failures are a half-pixel offset, swapped channels or a wrong pad split.

### Output
Parity table and sanitizer log.

### Quality Gate
- Max and mean difference printed for all five golden images, within the user tolerance.
- `compute-sanitizer` prints `ERROR SUMMARY: 0 errors`.

---

## Phase 3: Time It

### Entry Criteria
- Parity passed.

### Actions
1. Time with `cudaEventRecord` before and after the launch on the same stream, `cudaEventSynchronize`, then `cudaEventElapsedTime`.
2. Discard warm-up runs and report median and p99 over the user-chosen iteration count.
3. Profile once with `ncu --set basic ./build/test_preprocess` (Nsight Compute) and record achieved memory throughput; this kernel is memory bound, so a low value points at uncoalesced writes.

### Output
`cpp_preprocess_impl`.

### Quality Gate
- Timing table lists iterations, warm-up count, median and p99.

---

## Worked Example

Illustrative only. sm_87 GPU, 1242x375 BGR input to 640x640. Parity max diff 0.0039 (one gray level), mean 1.1e-05. `compute-sanitizer`: `ERROR SUMMARY: 0 errors`. Kernel median 0.09 ms, p99 0.12 ms over 1000 runs after 50 warm-up.

---

## Exit Criteria

DONE when the kernel matches the golden tensors within the user tolerance, passes `compute-sanitizer` memcheck, and its time is measured with CUDA events.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `nvcc` arch mismatch error at run time ("no kernel image is available") | **Adjust** `CUDA_ARCHITECTURES` to the GPU compute capability and **Retry**. |
| Phase 2 | Memcheck errors | **Stop**: fix the out-of-bounds index before any timing. |
| Phase 2 | Constant offset of half a pixel | **Adjust** the source coordinate mapping and **Retry**. |
| Phase 3 | Time much higher than Python version | **Return** the `ncu` memory throughput to diagnose access patterns. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
