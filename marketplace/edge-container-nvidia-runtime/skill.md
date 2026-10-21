# Edge Containers with the NVIDIA Container Runtime

**One-line description:** Configures Docker on a Jetson device to use the NVIDIA container runtime, selects a base image whose L4T tag matches the host release, and proves GPU access inside the container with a CUDA query before any model is deployed in it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `device_host` (string, required): SSH target of the device.
- `platform_report` (object, required): Output of `edge-jetpack-l4t-version-check`.
- `container_image` (string, required): The image the application will run in, or `choose` to have this flow select an NVIDIA L4T base image.

---

## Outputs

- `container_run_spec` (object): Image reference with digest, the exact `docker run` flags, the runtime configuration from `docker info`, and the in-container GPU verification output.

---

## Phase 1: Configure the Runtime

### Entry Criteria
- `platform_report` has an L4T release.

### Actions
1. Run `ssh <device_host> "dpkg -l | grep -E 'nvidia-container-toolkit|nvidia-container-runtime'"`. If absent, install with `sudo apt install nvidia-container-toolkit` (it ships with the JetPack apt repository).
2. Run `ssh <device_host> "docker info | grep -i -A3 runtime"`. Look for `nvidia` in the runtimes list.
3. If missing, run `sudo nvidia-ctk runtime configure --runtime=docker`, then `sudo systemctl restart docker`. This edits `/etc/docker/daemon.json`; back the file up first with `sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak` if it exists.
4. Decide default runtime: setting `"default-runtime": "nvidia"` in `daemon.json` makes `docker build` steps see the GPU; otherwise pass `--runtime nvidia` on every `docker run`. Record the choice.

### Output
Docker with the NVIDIA runtime registered.

### Quality Gate
- `docker info` lists `nvidia` under Runtimes.
- `/etc/docker/daemon.json` parses: `python3 -m json.tool /etc/docker/daemon.json` exits 0.

---

## Phase 2: Select a Matching Image

### Entry Criteria
- Runtime registered.

### Actions
1. Apply this rule: the image's L4T tag must equal the host L4T major release and should equal its minor release. A container built for one L4T major release does not run CUDA on another.
2. If `container_image` is `choose`, pick from NVIDIA NGC: `nvcr.io/nvidia/l4t-jetpack:r<major>.<minor>.<patch>` (full CUDA, cuDNN, TensorRT) for the host's release. List tags on the NGC catalog page; do not guess a tag.
3. Check how the runtime supplies libraries: `ls /etc/nvidia-container-runtime/host-files-for-container.d/ 2>/dev/null`. If CSV files exist, the runtime mounts host CUDA libraries into the container (older JetPack behavior); otherwise the image must carry its own CUDA stack.
4. Pull and pin by digest: `docker pull <image>` then `docker inspect --format '{{index .RepoDigests 0}}' <image>`.

### Output
Pinned image reference.

### Quality Gate
- Image tag's L4T release equals the host's major release.
- Image is recorded as `name@sha256:...`.

---

## Phase 3: Verify GPU Access Inside

### Entry Criteria
- Image pulled.

### Actions
1. Run `docker run --rm --runtime nvidia --network host <image@digest> bash -c "ls /dev/nv* | head; cat /etc/nv_tegra_release 2>/dev/null; /usr/src/tensorrt/bin/trtexec --help | head -3"`.
2. For a full CUDA check, bind-mount the deviceQuery binary built in `edge-cuda-cudnn-aarch64-verify` and run it: `docker run --rm --runtime nvidia -v $HOME/cuda-samples:/s <image@digest> /s/<path>/deviceQuery`. It must print `Result = PASS`.
3. Add flags only as needed and record each:
   - `--ipc=host` or `--shm-size=<size>` when PyTorch DataLoader workers or DeepStream need shared memory.
   - `-v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY` only for on-screen display.
   - `--device /dev/video0` for a V4L2 camera.
   - `--memory=<limit>` from `edge-unified-memory-budget`.
4. Assemble `container_run_spec`.

Do NOT: add `--privileged` to make an error go away. Find the device node or capability actually needed.

### Output
`container_run_spec`.

### Quality Gate
- deviceQuery inside the container prints `Result = PASS`.
- Every flag in `container_run_spec` has a recorded reason.

---

## Worked Example

Illustrative only.

Host L4T R36.4.0, `container_image` = `choose`.
```
$ docker info | grep -i runtime
 Runtimes: io.containerd.runc.v2 nvidia runc
 Default Runtime: runc
$ docker pull nvcr.io/nvidia/l4t-jetpack:r36.4.0
$ docker run --rm --runtime nvidia -v $HOME/cuda-samples:/s nvcr.io/nvidia/l4t-jetpack@sha256:<digest> /s/build/Samples/1_Utilities/deviceQuery/deviceQuery
...
Result = PASS
```

---

## Exit Criteria

DONE when a digest-pinned image with a matching L4T tag runs deviceQuery successfully under the NVIDIA runtime, with every run flag justified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `unknown or invalid runtime name: nvidia` | **Adjust**: rerun `nvidia-ctk runtime configure` and restart Docker. |
| Phase 2 | No image tag for the host release | **Return**: report it; build from the nearest matching `l4t-jetpack` tag only after the user accepts the mismatch risk. |
| Phase 3 | `CUDA driver version is insufficient` inside container | **Stop**: the image's L4T release does not match the host; choose a matching tag. |
| Phase 3 | `cannot open shared object file` for a CUDA library | **Adjust**: check the host-files CSV mode from Phase 2 step 3 and pick an image that carries the libraries. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
