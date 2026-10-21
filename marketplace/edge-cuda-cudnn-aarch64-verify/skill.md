# Edge CUDA and cuDNN Verification on aarch64

**One-line description:** Proves that CUDA, cuDNN and the integrated GPU actually work on a Jetson-class device by compiling and running deviceQuery, reading the compute capability, and confirming the cuDNN headers and libraries agree with the packages in the platform report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `platform_report` (object, required): Output of `edge-jetpack-l4t-version-check`.

---

## Outputs

- `cuda_stack_report` (object): nvcc version, CUDA runtime and driver versions from deviceQuery, GPU name, compute capability (major.minor), cuDNN version from its header, and the pass or fail result of each check with raw output.

---

## Phase 1: Find nvcc

### Entry Criteria
- `platform_report` lists a CUDA toolkit package.

### Actions
1. Run `ssh <device_host> /usr/local/cuda/bin/nvcc --version`. Record the `release X.Y` line.
2. Run `ssh <device_host> "bash -lc 'which nvcc'"`. If empty, nvcc is not on PATH. This is the default on a fresh Jetson image. Add these two lines to `~/.bashrc` on the device, then re-run:
   - `export PATH=/usr/local/cuda/bin:$PATH`
   - `export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH`
3. Confirm the nvcc release equals the CUDA version in `platform_report`.

Do NOT: install a CUDA toolkit from the x86 or SBSA download pages onto a Jetson. JetPack ships the matching aarch64 toolkit through `apt`.

### Output
Working nvcc path and version.

### Quality Gate
- `/usr/local/cuda/bin/nvcc --version` exits 0.
- nvcc release equals the CUDA version recorded in `platform_report`.

---

## Phase 2: Build and Run deviceQuery

### Entry Criteria
- nvcc works.

### Actions
1. On the device, clone the samples at the tag that matches the CUDA version: `git clone --depth 1 --branch v<CUDA major.minor> https://github.com/NVIDIA/cuda-samples.git`. If that tag does not exist, run `git ls-remote --tags https://github.com/NVIDIA/cuda-samples.git` and pick the closest tag not newer than the installed CUDA.
2. Build deviceQuery following the README of that tag (older tags use `make` in `Samples/1_Utilities/deviceQuery`; newer tags use CMake from the repository root). Read the README; do not guess the build system.
3. Run `./deviceQuery`. Record the lines `Device 0: "<name>"`, `CUDA Driver Version / Runtime Version`, `CUDA Capability Major/Minor version number`, and `Integrated GPU sharing Host Memory`.
4. Confirm the last line reads `Result = PASS`.

### Output
Device facts from deviceQuery.

### Quality Gate
- deviceQuery printed `Result = PASS`.
- `Integrated GPU sharing Host Memory: Yes` is recorded (confirms the unified memory model used by later flows).
- Compute capability is recorded as major.minor.

---

## Phase 3: Verify cuDNN

### Entry Criteria
- deviceQuery passed.

### Actions
1. Run `ssh <device_host> "grep -E 'define CUDNN_(MAJOR|MINOR|PATCHLEVEL)' /usr/include/cudnn_version*.h /usr/include/aarch64-linux-gnu/cudnn_version*.h 2>/dev/null"`. Record major, minor, patch.
2. Run `ssh <device_host> "ldconfig -p | grep libcudnn"`. Record the library paths.
3. Confirm the header version equals the `libcudnn` package version in `platform_report`.
4. Assemble `cuda_stack_report`.

### Output
`cuda_stack_report`.

### Quality Gate
- cuDNN header version equals the package version.
- `ldconfig -p` lists at least one `libcudnn.so` entry.

---

## Worked Example

Illustrative only.

```
$ /usr/local/cuda/bin/nvcc --version
Cuda compilation tools, release 12.6, V12.6.68
$ ./deviceQuery
Device 0: "Orin"
  CUDA Driver Version / Runtime Version          12.6 / 12.6
  CUDA Capability Major/Minor version number:    8.7
  Integrated GPU sharing Host Memory:            Yes
Result = PASS
$ grep -E 'define CUDNN_(MAJOR|MINOR|PATCHLEVEL)' /usr/include/aarch64-linux-gnu/cudnn_version*.h
#define CUDNN_MAJOR 9
#define CUDNN_MINOR 3
#define CUDNN_PATCHLEVEL 0
```
Result: compute capability 8.7, cuDNN 9.3.0, all checks pass.

---

## Exit Criteria

DONE when `cuda_stack_report` holds a passing deviceQuery, the compute capability, and a cuDNN version that matches its package.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `/usr/local/cuda/bin/nvcc` missing | **Adjust**: install with `sudo apt install nvidia-jetpack` (or the `cuda-toolkit-*` package named in the JetPack release notes), then retry. |
| Phase 2 | deviceQuery reports `no CUDA-capable device` | **Stop**: check `ls -l /dev/nvhost* /dev/nvgpu* 2>/dev/null` and that the user is in the `video` group; do not continue to engine builds. |
| Phase 2 | Sample tag fails to build | **Retry**: use an older tag; samples newer than the toolkit often need newer headers. |
| Phase 3 | Header and package disagree | **Return**: report mixed cuDNN installs; remove the stray copy only with the user's approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
