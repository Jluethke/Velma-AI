# Edge Python: Install a CUDA-Enabled PyTorch Wheel on Jetson

**One-line description:** Installs and verifies a PyTorch build that matches the device's JetPack release in an isolated virtual environment, catching the common failure where `pip install torch` silently installs a CPU-only or wrong-platform wheel.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `platform_report` (object, required): Output of `edge-jetpack-l4t-version-check`.

---

## Outputs

- `python_env_report` (object): Virtual environment path, Python version, torch and torchvision versions, `torch.version.cuda`, `torch.cuda.is_available()`, the GPU name torch reports, the wheel source URL, and a GPU tensor smoke-test result.

---

## Phase 1: Choose the Wheel Source

### Entry Criteria
- `platform_report` holds a JetPack version.

### Actions
1. Open NVIDIA's "Installing PyTorch for Jetson Platform" documentation and the release notes for the recorded JetPack version. Record the wheel URL or pip index that NVIDIA lists for that JetPack version.
2. Use this decision table:

| Situation | Wheel source |
|---|---|
| NVIDIA lists a wheel or index for this JetPack | Use exactly that source. |
| The project runs inside an NVIDIA container (for example an `l4t-pytorch` or framework image for this L4T) | Use the torch already in the image; skip Phase 2 install steps 3 and 4. |
| No listed source | Stop and report an open question; do not pick a wheel by guessing. |

3. Record the Python version the wheel targets (the `cp310` style tag in the filename) and confirm `python3 --version` on the device matches.

Do NOT: run plain `pip install torch` and assume it works. A PyPI aarch64 wheel may be CPU-only or built for a different ARM platform than the Jetson GPU.

### Output
A single wheel source tied to the JetPack version.

### Quality Gate
- The chosen source is a URL or index from NVIDIA documentation, cited.
- The wheel's Python tag matches the device's `python3 --version`.

---

## Phase 2: Install in a Virtual Environment

### Entry Criteria
- Wheel source chosen.

### Actions
1. `python3 -m venv --system-site-packages ~/venvs/edge` (system site packages let the venv see the JetPack `tensorrt` Python bindings installed by `apt`).
2. `source ~/venvs/edge/bin/activate && python -m pip install --upgrade pip`.
3. Install torch from the chosen source only, for example `pip install <wheel URL>` or `pip install torch --index-url <NVIDIA index>`.
4. Install torchvision only from the same source or the matching version NVIDIA lists. A torchvision built against a different torch fails at import with an undefined symbol error.
5. Run `pip check`. Record its output.

### Output
Populated virtual environment.

### Quality Gate
- `pip check` prints `No broken requirements found.`
- `pip show torch` shows the version from the chosen source.

---

## Phase 3: Verify the GPU Path

### Entry Criteria
- Install completed.

### Actions
1. Run:
   `python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available()); print(torch.cuda.get_device_name(0)); x=torch.ones(1024,1024,device='cuda'); print(float((x@x).sum()))"`
2. Read the result with this table:

| Output | Meaning | Action |
|---|---|---|
| `torch.version.cuda` is `None` | CPU-only wheel | Uninstall and return to Phase 1. |
| `is_available()` False, version not None | Wheel built for another CUDA or platform | Uninstall and return to Phase 1. |
| Device name printed and sum printed | Working GPU path | Continue. |

3. The printed sum must equal 1024 x 1024 x 1024 = 1073741824.0.
4. Assemble `python_env_report`.

### Output
`python_env_report`.

### Quality Gate
- `torch.cuda.is_available()` printed `True`.
- The smoke-test sum printed `1073741824.0`.

---

## Worked Example

Illustrative only.

```
$ python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available()); ..."
2.5.0a0+872d972e41.nv24.08 12.6 True
Orin
1073741824.0
```
`python_env_report`: venv `~/venvs/edge`, Python 3.10, torch from the NVIDIA-listed source for JetPack 6.1, GPU path verified.

---

## Exit Criteria

DONE when a virtual environment on the device imports a CUDA-enabled torch that runs a GPU matrix multiply with the expected result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No NVIDIA-listed source for this JetPack | **Stop**: report the open question; offer the container path instead. |
| Phase 2 | `ImportError: libcudnn.so...` or `libcusparseLt.so` missing | **Adjust**: install the library NVIDIA's install page names for that wheel, then retry. |
| Phase 2 | NumPy ABI warning at import | **Adjust**: install the NumPy major version the wheel was built against, as listed in its release notes. |
| Phase 3 | `is_available()` False | **Retry**: return to Phase 1; never patch around it with environment variables. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
