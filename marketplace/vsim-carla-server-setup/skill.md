# CARLA Server Setup and Client Version Match

**One-line description:** Installs a CARLA server (packaged release or Docker image), launches it headless with explicit ports, and proves the Python client and server report the same version before any scenario work starts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `carla_version` (string, required): Exact CARLA release to use, for example "0.9.15". All teammates and CI must pin the same value.
- `host_os` (string, required): "ubuntu-22.04", "ubuntu-20.04", "windows-11" or "docker". Selects the launch procedure.
- `gpu_model` (string, required): GPU and driver version as printed by `nvidia-smi` (first table row). CARLA renders with Unreal Engine and needs a discrete GPU.

---

## Outputs

- `carla_server_cmd` (string): The exact, tested command line that starts the server, including RPC port and render flags.
- `carla_client_env` (object): Python interpreter path, installed `carla` package version, RPC port, streaming port, Traffic Manager port, and the output of the version check.

---

## Phase 1: Install the Matching Server Build

### Entry Criteria
- `carla_version`, `host_os` and `gpu_model` are present.
- `nvidia-smi` runs and lists the GPU. If it fails, fix the driver first; CARLA will not render without it.

### Actions
1. Open the release notes for `carla_version` on the CARLA GitHub releases page and record: the Unreal Engine generation (UE4 for 0.9.x, UE5 for 0.10.x), the supported Python versions, and the supported OS list. Do not assume; read them.
2. Pick the install path from this table:

| `host_os` | Install |
|---|---|
| ubuntu-* | Download `CARLA_<version>.tar.gz` from the release page, extract to a directory with no spaces, for example `~/carla/<version>`. Extract `AdditionalMaps_<version>.tar.gz` into the same directory only if you need Town06, Town07, Town10HD extras or larger maps. |
| windows-11 | Download `CARLA_<version>.zip`, extract to a short path such as `C:\carla\<version>` (long paths break Unreal asset loading). |
| docker | `docker pull carlasim/carla:<version>`. Confirm the NVIDIA Container Toolkit works with `docker run --rm --gpus all ubuntu nvidia-smi`. |

3. Record the launcher name inside the extracted folder: `CarlaUE4.sh` / `CarlaUE4.exe` for 0.9.x, `CarlaUnreal.sh` / `CarlaUnreal.exe` for 0.10.x. Use `ls` or `dir` to confirm; do not guess.

### Output
An extracted server directory or pulled image, with the launcher file name confirmed.

### Quality Gate
- `ls <carla_dir>` (or `docker images carlasim/carla`) shows the launcher or image tag equal to `carla_version`.
- Release notes are cited with the supported Python versions written down.

---

## Phase 2: Launch Headless with Explicit Ports

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Choose the RPC port. CARLA's default is 2000; the server also opens the streaming port at RPC port + 1. Traffic Manager defaults to 8000. If any of these is in use (`ss -ltnp | grep -E ':2000|:2001|:8000'` on Linux, `netstat -ano | findstr :2000` on Windows), pick a free pair and record it.
2. Start the server with the command for your OS:
   - Linux: `./CarlaUE4.sh -RenderOffScreen -carla-rpc-port=2000 -quality-level=Low`
   - Windows: `CarlaUE4.exe -RenderOffScreen -carla-rpc-port=2000 -quality-level=Low`
   - Docker: `docker run --rm --privileged --gpus all --net=host carlasim/carla:<version> /bin/bash ./CarlaUE4.sh -RenderOffScreen -carla-rpc-port=2000`
   Replace `CarlaUE4` with `CarlaUnreal` for 0.10.x. Use `-quality-level=Epic` only when camera image realism matters for the test; Low is faster and changes rendering only, not physics.
3. Wait for the process to settle (CPU drops, no new log lines). Do not connect a client in the first seconds; first-launch shader compilation can take minutes.
4. Do NOT pass `-nullrhi` when any camera sensor is used; it disables rendering and camera sensors return nothing.

### Output
A running server process with known ports.

### Quality Gate
- `ss -ltnp` (or `netstat -ano`) shows the server listening on the RPC port and RPC port + 1.
- The server process is still alive after the client check in Phase 3.

---

## Phase 3: Install the Client and Prove the Version Match

### Entry Criteria
- Server listening.

### Actions
1. Create a virtual environment with a Python version from the release notes: `python3.10 -m venv ~/venvs/carla-<version>` then activate it.
2. Install the client: `pip install carla==<version>` when PyPI has that wheel for your Python version. Otherwise install the wheel shipped in `PythonAPI/carla/dist/` with `pip install PythonAPI/carla/dist/carla-<version>-cp310-*.whl`.
3. Run the version check:
   `python -c "import carla; c=carla.Client('localhost',2000); c.set_timeout(20.0); print(c.get_client_version(), c.get_server_version()); print(c.get_world().get_map().name)"`
4. Read the output with this table:

| Output | Meaning | Action |
|---|---|---|
| Two identical version strings and a map name | Match | Record `carla_client_env`. |
| Two different version strings | Client/server mismatch; RPC calls fail in odd ways later | Reinstall the client wheel that matches the server. |
| `RuntimeError: time-out of 20000ms while waiting for the simulator` | Server not ready, wrong port, or firewall | Recheck Phase 2 ports; wait for shader compile; retry. |
| `ModuleNotFoundError: No module named 'carla'` | Wrong interpreter | Activate the venv and rerun. |

5. Write `carla_server_cmd` exactly as launched and `carla_client_env` with interpreter path (`which python`), `pip show carla` version, and ports.

### Output
`carla_server_cmd`, `carla_client_env`.

### Quality Gate
- The version check prints two identical version strings, both equal to `carla_version`.
- `pip show carla` prints `Version: <carla_version>`.

---

## Worked Example

Illustrative. Input: `carla_version` = "0.9.15", `host_os` = "ubuntu-22.04", `gpu_model` = "NVIDIA RTX 4070, driver 550.xx".

Phase 1: release notes list Python 3.7 to 3.10 wheels for 0.9.15 (verify on the page). `ls ~/carla/0.9.15` shows `CarlaUE4.sh`.

Phase 2: `./CarlaUE4.sh -RenderOffScreen -carla-rpc-port=2000 -quality-level=Low`; `ss -ltnp | grep 200` shows `:2000` and `:2001` held by `CarlaUE4-Linux-`.

Phase 3:
```
$ python -c "import carla; c=carla.Client('localhost',2000); c.set_timeout(20.0); print(c.get_client_version(), c.get_server_version()); print(c.get_world().get_map().name)"
0.9.15 0.9.15
Carla/Maps/Town10HD_Opt
```
`carla_server_cmd` = the Phase 2 line; `carla_client_env` = {python: ~/venvs/carla-0.9.15/bin/python, carla: 0.9.15, rpc: 2000, streaming: 2001, tm: 8000}.

---

## Exit Criteria

DONE when the server starts from `carla_server_cmd`, the client in `carla_client_env` connects, and both report `carla_version`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `nvidia-smi` fails | **Stop**: install or repair the GPU driver; CARLA cannot render without it. |
| Phase 1 | No wheel for the local Python version | **Adjust**: create a venv with a Python version the release notes list. |
| Phase 2 | Server exits with a Vulkan or GPU error | **Adjust**: update the driver, then retry; on Linux confirm `vulkaninfo` lists the GPU. |
| Phase 2 | Port already in use | **Adjust**: choose a different RPC port and pass the same port to every client. |
| Phase 3 | Version mismatch | **Retry**: reinstall the client from the server's own `PythonAPI/carla/dist`. Never mix versions. |
| Phase 3 | Time-out on connect | **Retry**: wait for shader compile, then recheck ports and firewall. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
