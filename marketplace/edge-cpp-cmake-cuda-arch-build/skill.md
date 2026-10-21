# Edge C++: CMake CUDA Build for the Device's Compute Capability

**One-line description:** Configures a CMake C++/CUDA project to compile for exactly the Jetson GPU's compute capability and link TensorRT and the CUDA runtime from their aarch64 locations, then proves the binary carries code for that architecture with cuobjdump.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Path on the device to the C++ project root containing `CMakeLists.txt`.
- `cuda_stack_report` (object, required): Output of `edge-cuda-cudnn-aarch64-verify`; supplies the compute capability.

---

## Outputs

- `cmake_build_report` (object): CMake version, the `CMAKE_CUDA_ARCHITECTURES` value used, configure and build exit codes, the binary path, and the cuobjdump listing showing the embedded architectures.

---

## Phase 1: Set the Architecture

### Entry Criteria
- `cuda_stack_report` holds a compute capability such as `8.7`.

### Actions
1. Convert the compute capability to the CMake form by removing the dot (`8.7` becomes `87`). Read it from deviceQuery; do not copy a value from another board.
2. Check `cmake --version`. `CMAKE_CUDA_ARCHITECTURES` and `find_package(CUDAToolkit)` need CMake 3.18 or newer (CMake documentation). If older, install a newer CMake with `pip install cmake` in a venv or from Kitware's aarch64 release.
3. In `CMakeLists.txt`, ensure these exist (edit one file, this one only):
   - `project(<name> LANGUAGES CXX CUDA)`
   - `set(CMAKE_CUDA_ARCHITECTURES <value>)` before targets are defined, or pass `-DCMAKE_CUDA_ARCHITECTURES=<value>` at configure.
   - `find_package(CUDAToolkit REQUIRED)`
   - `target_link_libraries(<target> PRIVATE CUDA::cudart nvinfer nvonnxparser)` (drop `nvonnxparser` when the app only loads engines).
   - `target_include_directories(<target> PRIVATE /usr/include/aarch64-linux-gnu)` because JetPack installs `NvInfer.h` there.

### Output
Edited `CMakeLists.txt` with the architecture pinned.

### Quality Gate
- `grep -n CMAKE_CUDA_ARCHITECTURES CMakeLists.txt` shows the value from deviceQuery, or the configure command passes it.
- `ls /usr/include/aarch64-linux-gnu/NvInfer.h` exits 0.

---

## Phase 2: Configure and Build

### Entry Criteria
- `CMakeLists.txt` edited.

### Actions
1. `cmake -S <project_dir> -B <project_dir>/build -DCMAKE_BUILD_TYPE=Release -DCMAKE_CUDA_COMPILER=/usr/local/cuda/bin/nvcc`.
2. `cmake --build <project_dir>/build -j$(nproc) 2>&1 | tee build.log`. On 8 GB modules, if the build is killed (`c++: fatal error: Killed signal terminated program`), rerun with `-j2`; that message means the compiler ran out of memory.
3. Record both exit codes.

Do NOT: cross-compile on x86 and copy the binary over unless the cross toolchain uses the same JetPack sysroot; library versions must match the device.

### Output
Built binary.

### Quality Gate
- Configure and build exit codes are 0.
- `build.log` has zero lines matching `error:`.

---

## Phase 3: Prove the Embedded Architecture

### Entry Criteria
- Binary exists.

### Actions
1. Run `/usr/local/cuda/bin/cuobjdump --list-elf <binary>`. Each line ends with an `sm_XX` name. For a target with separate CUDA object libraries, run it on each `.so` as well.
2. Confirm `sm_<value>` from Phase 1 appears. If only PTX is present (`cuobjdump --list-ptx` shows entries but `--list-elf` does not), the first launch JIT-compiles kernels and adds startup latency; set the real architecture.
3. Run the binary once. If it prints `no kernel image is available for execution on the device`, the architecture is wrong; return to Phase 1.
4. Assemble `cmake_build_report`.

### Output
`cmake_build_report`.

### Quality Gate
- `cuobjdump --list-elf` output contains `sm_<value>`.
- The binary's first run does not print `no kernel image is available`.

---

## Worked Example

Illustrative only.

Input: compute capability `8.7`, project at `~/edge_infer`.
```
$ cmake -S ~/edge_infer -B ~/edge_infer/build -DCMAKE_BUILD_TYPE=Release -DCMAKE_CUDA_ARCHITECTURES=87 -DCMAKE_CUDA_COMPILER=/usr/local/cuda/bin/nvcc
-- The CUDA compiler identification is NVIDIA 12.6.68
-- Build files have been written to: /home/nvidia/edge_infer/build
$ cuobjdump --list-elf build/edge_infer
ELF file    1: edge_infer.1.sm_87.cubin
```

---

## Exit Criteria

DONE when the project builds on the device and cuobjdump shows code for the device's exact compute capability.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | CMake older than 3.18 | **Adjust**: install a newer CMake, then retry. |
| Phase 2 | `No CMAKE_CUDA_COMPILER could be found` | **Adjust**: pass `-DCMAKE_CUDA_COMPILER=/usr/local/cuda/bin/nvcc`. |
| Phase 2 | `NvInfer.h: No such file` | **Adjust**: add the aarch64 include directory; confirm `libnvinfer-dev` is installed with `dpkg -l libnvinfer-dev`. |
| Phase 2 | Compiler killed | **Retry**: lower `-j`; enable swap only temporarily for the build. |
| Phase 3 | Wrong `sm_` in the binary | **Return**: to Phase 1; a stale cache may hold the old value, so delete only the `build` directory and reconfigure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
