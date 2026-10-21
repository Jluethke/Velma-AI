# Edge JetPack and L4T Version Check

**One-line description:** Reads the exact L4T release, JetPack meta-package, module model, kernel, and CUDA, cuDNN and TensorRT package versions from a Jetson-class device, so every later build step targets the software actually installed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the Jetson device, for example `user@192.168.55.1` (the default USB device-mode address) or a LAN hostname.

---

## Outputs

- `platform_report` (object): Module model string, L4T release and revision, JetPack meta-package version, kernel release, CUDA, cuDNN and TensorRT package versions, and the raw command output each value was read from.

---

## Phase 1: Read the L4T Release and Module

### Entry Criteria
- `device_host` answers `ssh <device_host> true` with exit code 0.

### Actions
1. Run `ssh <device_host> cat /etc/nv_tegra_release`. The first line has the form `# R36 (release), REVISION: 4.0, ...`. Record the major release (`R36`) and revision (`4.0`) as written.
2. Run `ssh <device_host> dpkg-query --show nvidia-l4t-core`. Record the package version (for example `36.4.0-20240912212859`). It must agree with step 1.
3. Run `ssh <device_host> "tr -d '\0' < /proc/device-tree/model"`. Record the module and carrier string exactly.
4. Run `ssh <device_host> uname -r` and `ssh <device_host> uname -m`. The machine must print `aarch64`.
5. Run `ssh <device_host> "apt-cache policy nvidia-jetpack"`. Record the `Installed:` line. `(none)` means the JetPack meta-package was never installed; the L4T base may still be present.

### Output
Raw L4T, module and kernel facts.

### Quality Gate
- The L4T major release from `/etc/nv_tegra_release` matches the major field of the `nvidia-l4t-core` version.
- `uname -m` printed `aarch64`.

---

## Phase 2: Map L4T to JetPack

### Entry Criteria
- L4T release recorded.

### Actions
1. Open the NVIDIA "JetPack Archive" page (developer.nvidia.com/embedded/jetpack-archive) and find the row whose L4T version equals the recorded release and revision.
2. Record the JetPack version from that row. Well-known families: R32 is JetPack 4, R35 is JetPack 5, R36 is JetPack 6. For any other release, use only the archive row; do not guess.
3. If `apt-cache policy nvidia-jetpack` showed an installed version, confirm its major and minor match the archive row.

### Output
JetPack version tied to an archive row.

### Quality Gate
- The JetPack version cites the archive row by its L4T version string.
- Meta-package version (when installed) agrees with the archive row.

---

## Phase 3: Read Accelerator Library Versions

### Entry Criteria
- JetPack version recorded.

### Actions
1. Run `ssh <device_host> "dpkg -l | grep -E 'cuda-toolkit|cuda-cudart|libcudnn|libnvinfer|tensorrt|deepstream'"`. Record each package name and version column.
2. Run `ssh <device_host> "ls -d /usr/local/cuda*"` and `ssh <device_host> readlink -f /usr/local/cuda`. Record which CUDA directory the `/usr/local/cuda` link points at.
3. Run `ssh <device_host> "python3 -c 'import tensorrt; print(tensorrt.__version__)'"`. If it raises `ModuleNotFoundError`, record "TensorRT Python bindings not installed"; this matters only for the Python stack.
4. Assemble `platform_report` with every value and the command that produced it.

### Output
`platform_report`.

### Quality Gate
- `platform_report` contains a non-empty value or an explicit "not installed" for CUDA, cuDNN and TensorRT.
- Every value is paired with the command line that printed it.

---

## Worked Example

Illustrative only.

Input: `device_host` = `nvidia@orin-dev.local`.

Phase 1:
```
$ ssh nvidia@orin-dev.local cat /etc/nv_tegra_release
# R36 (release), REVISION: 4.0, GCID: 37537400, BOARD: generic, EABI: aarch64, DATE: ...
$ ssh nvidia@orin-dev.local dpkg-query --show nvidia-l4t-core
nvidia-l4t-core	36.4.0-20240912212859
$ ssh nvidia@orin-dev.local "tr -d '\0' < /proc/device-tree/model"
NVIDIA Jetson AGX Orin Developer Kit
```
Phase 2: the archive row for L4T 36.4 lists JetPack 6.1.
Phase 3: `libnvinfer10 10.3.0.30-1+cuda12.5`, `libcudnn9-cuda-12 9.3.0.75-1`, `/usr/local/cuda -> /usr/local/cuda-12.6`.

---

## Exit Criteria

DONE when `platform_report` names the module, L4T release, JetPack version backed by an archive row, and the CUDA, cuDNN and TensorRT versions, each with its source command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | SSH refused or times out | **Stop**: fix network access first; do not read versions from a different device. |
| Phase 1 | `/etc/nv_tegra_release` missing | **Stop**: the device is not running L4T; this domain does not apply. |
| Phase 1 | L4T file and `nvidia-l4t-core` disagree | **Return**: report a partial upgrade; the user must finish `apt` upgrade or reflash before any build. |
| Phase 2 | Release not in the archive | **Adjust**: record the L4T version only and mark JetPack as an open question. |
| Phase 3 | Two CUDA directories present | **Adjust**: record both and which one `/usr/local/cuda` resolves to; later steps use the resolved one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
