# Python Multi-Stage Dockerfile

**One-line description:** Writes a multi-stage Dockerfile for a Python service that builds a virtual environment in a builder stage with uv, pip or poetry from the lockfile, copies only `/opt/venv` and the app into a slim or distroless runtime, and verifies the interpreter path, imports and entrypoint inside the built image.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root and build context.
- `build_profile` (object, required): From `ctr-stack-inventory` with `stack=python`.
- `pinned_bases` (object, required): From `ctr-pin-base-digest`.

---

## Outputs

- `py_dockerfile` (object): Path to the Dockerfile written, the stage names (`build`, `runtime`, plus `test` if added later), the `docker build` command used, and the verification outputs from Phase 3.

---

## Phase 1: Write the Builder Stage

### Entry Criteria
- `build_profile.package_manager` is `uv`, `pip`, `poetry` or `pipenv`, with a lockfile.
- `pinned_bases.builder_ref` and `runtime_ref` are set.

### Actions
1. If a Dockerfile exists, copy it to `Dockerfile.orig` outside the build (record the path) and replace only the content; do not create a second competing Dockerfile.
2. Start the file with the syntax line so BuildKit features (`--mount`) are available: `# syntax=docker/dockerfile:1`.
3. Write the builder stage for the package manager. Dependencies are installed BEFORE the source is copied so the install layer is cached.

uv:
```
FROM <builder_ref> AS build
COPY --from=ghcr.io/astral-sh/uv:<uv version>@sha256:<digest> /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/opt/venv UV_PYTHON_DOWNLOADS=never
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-install-project
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-editable
```
pip with `requirements.txt`:
```
FROM <builder_ref> AS build
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
COPY . /app
```
If `requirements.txt` contains `--hash=` lines, add `--require-hashes` to the install. poetry: install with `POETRY_VIRTUALENVS_CREATE=false` inside a venv you created at `/opt/venv`, run `poetry install --only main --no-root` after copying `pyproject.toml` and `poetry.lock`, then copy source and run `poetry install --only main` to install the project itself. Check the flags with `poetry install --help` for the installed Poetry version.
4. If `build_profile.native_deps` is not empty, install compilers only in the builder: `RUN apt-get update && apt-get install -y --no-install-recommends build-essential <lib>-dev && rm -rf /var/lib/apt/lists/*`.
5. Do NOT use `pip install .` with `--user` or install into system site-packages; the runtime copy depends on everything being under `/opt/venv`.

### Output
Builder stage text.

### Quality Gate
- The lockfile is copied or bind-mounted before `COPY . /app` (check line order with `grep -n -E 'uv.lock|requirements|poetry.lock|COPY \. ' Dockerfile`).
- `docker build --target build -t <name>:build <project_dir>` exits 0.

---

## Phase 2: Write the Runtime Stage

### Entry Criteria
- Builder stage builds.

### Actions
1. Slim runtime (default row):
```
FROM <runtime_ref> AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH=/opt/venv/bin:$PATH
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY --from=build /app /app
EXPOSE <listen_port>
CMD <build_profile.entrypoint as JSON array>
```
   For uv non-editable installs the project lives inside `/opt/venv`; copy only the source paths the entrypoint needs (for example `COPY --from=build /app/src /app/src`) if the module is not installed into the venv.
2. Distroless runtime (`gcr.io/distroless/python3-debian12`): the venv's `bin/python` is a symlink to the builder's interpreter. Build the venv with Debian's `/usr/bin/python3` (builder `debian:12-slim` plus `apt-get install python3-venv`) so the symlink target exists in distroless. Set `ENTRYPOINT ["/opt/venv/bin/python"]` or call the module with `CMD ["-m", "<module>"]` after the image's own `python3` entrypoint. Do NOT copy a venv built on `python:3.x-slim`; its links point to `/usr/local/bin/python`, which distroless does not have.
3. Runtime system libraries: if the builder installed `libpq-dev`, the runtime needs `libpq5` (Debian) via `apt-get install -y --no-install-recommends libpq5`. Distroless cannot run apt; copy the needed `.so` files explicitly or choose the slim runtime.
4. CMD must be exec form. Shell form (`CMD uvicorn app:app`) runs under `/bin/sh -c`, so the app is not PID 1 and does not receive SIGTERM.
5. Change only the Dockerfile in this flow. Do not edit application code to make the build pass.

### Output
Complete two-stage Dockerfile.

### Quality Gate
- `docker build -t <name>:dev <project_dir>` exits 0.
- `grep -n "^CMD\|^ENTRYPOINT" Dockerfile` shows a JSON array.

---

## Phase 3: Verify Inside the Image

### Entry Criteria
- Runtime image built.

### Actions
1. Interpreter and venv are wired: `docker run --rm --entrypoint /opt/venv/bin/python <name>:dev -c "import sys; print(sys.executable, sys.version)"`. Expect `/opt/venv/bin/python` and the `runtime_version` minor.
2. Imports resolve: `docker run --rm --entrypoint /opt/venv/bin/python <name>:dev -c "import <top_level_package>"`. Exit 0 required. `ModuleNotFoundError` means the venv or source copy is wrong.
3. No compilers leaked into runtime (slim only): `docker run --rm --entrypoint sh <name>:dev -c 'command -v gcc || echo none'` prints `none`.
4. The app starts: `docker run --rm -d --name pytest-start -p <port>:<port> <name>:dev`, then `docker logs pytest-start` shows the server's startup line (for uvicorn: `Uvicorn running on http://0.0.0.0:<port>`). Stop with `docker stop pytest-start`.

### Output
`py_dockerfile` with verification outputs.

### Quality Gate
- Step 1 output shows `/opt/venv/bin/python` and the expected minor version.
- Step 2 exits 0; step 4 log shows the startup line.

---

## Worked Example

Illustrative. `build_profile` from the stack inventory example (uv, 3.12, uvicorn on 8000).

Phase 1: builder `python:3.12-slim-bookworm@sha256:...`; `uv sync --frozen --no-dev --no-install-project` layer then `COPY . /app`. `docker build --target build` ends `naming to docker.io/library/orders-api:build done`.

Phase 2: runtime same base, `COPY --from=build /opt/venv /opt/venv`, `COPY --from=build /app/orders /app/orders`, `CMD ["uvicorn","orders.main:app","--host","0.0.0.0","--port","8000"]`.

Phase 3: `/opt/venv/bin/python 3.12.7 (main, ...)`; `import orders` exits 0; `gcc` check prints `none`; logs show `INFO:     Uvicorn running on http://0.0.0.0:8000`.

---

## Exit Criteria

DONE when the two-stage Dockerfile builds, the runtime holds only `/opt/venv`, the app source and runtime libraries, and the Phase 3 checks pass with pasted output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `uv sync --frozen` reports the lockfile is out of date | **Stop**: the lockfile does not match `pyproject.toml`; ask the user to run `uv lock` and commit. Do not drop `--frozen`. |
| Phase 1 | Wheel build fails for a native package | **Adjust**: add the `-dev` package named in the error to the builder apt line only. |
| Phase 2 | `exec /opt/venv/bin/python: no such file or directory` on distroless | **Adjust**: rebuild the venv with `/usr/bin/python3` from Debian as in Phase 2 step 2. |
| Phase 3 | `ImportError: libpq.so.5` | **Adjust**: add the runtime library to the runtime stage, rebuild, rerun Phase 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
