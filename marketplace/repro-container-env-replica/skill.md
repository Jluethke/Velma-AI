# Container Replica of the Reporter's Environment

**One-line description:** Builds a pinned Docker image that matches the reporter's OS, libc, architecture and runtime from the environment diff, so a bug that only happens "on their machine" can be run locally, or records that the local machine already matches and no container is needed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `env_snapshot` (object, required): Output of `repro-env-capture`.
- `env_diff` (object[], required): Output of `repro-env-capture`.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `replica_recipe` (object): Either `{"mode": "local"}` with the list of environment variables and toolchain switches to apply, or `{"mode": "container"}` with the Dockerfile path (outside the repo or in an ignored directory), the exact `docker build` and `docker run` commands, the image digest, and a table showing each `env_diff` row and how the image matches it.

---

## Phase 1: Decide Local or Container

### Entry Criteria
- `env_diff` exists.

### Actions
1. Count `env_diff` rows with `action` == `replicate in container`.
2. Apply this table:

| Rows needing container | Decision |
|---|---|
| 0 | `mode` = `local`. Copy every `match locally` row into a list of shell commands (for example `export TZ=America/Los_Angeles`, `nvm use 20.11.1`, `pyenv local 3.11.9`). Skip Phases 2 and 3. |
| 1 or more | `mode` = `container`. Continue. |

3. Check Docker is usable: `docker version` must print both a Client and a Server section. If only the Client section prints, the daemon is not running.
4. If any row is an architecture difference (for example reporter `aarch64`, local `x86_64`), check emulation: `docker buildx ls` lists platforms; the target platform must appear (for example `linux/arm64`). Note that emulated runs through QEMU are slower and can hide or create timing bugs; record this in the recipe.

### Output
Decision and, for local mode, the final `replica_recipe`.

### Quality Gate
- `docker version` shows a Server section, or `mode` is `local`.
- The target platform appears in `docker buildx ls` output when an architecture row exists.

---

## Phase 2: Write the Dockerfile

### Entry Criteria
- `mode` is `container`.

### Actions
1. Choose a base image whose tag names the reported OS release and runtime version, then pin it by digest: run `docker pull <image>:<tag>` and `docker inspect --format '{{index .RepoDigests 0}}' <image>:<tag>`; use `FROM <image>@sha256:<digest>`.

| `stack` | Base image family (pick the tag matching the reported version) |
|---|---|
| python | `python:<X.Y.Z>-slim-<debian codename>` or `ubuntu:<release>` plus `deadsnakes` when the reporter used the distro Python |
| node | `node:<X.Y.Z>-<debian codename>` or `node:<X.Y.Z>-alpine<ver>` (alpine uses musl, not glibc; only choose it when the reporter did) |
| go | `golang:<X.Y.Z>-<debian codename>` |
| java | `eclipse-temurin:<feature>-jdk-<ubuntu codename>` matching the reported vendor if given |
| rust | `rust:<X.Y.Z>-<debian codename>` |
| cpp | `ubuntu:<release>`, `debian:<release>`, `fedora:<release>` or `alpine:<release>`, then install the reported compiler version with the distro package manager |

2. Write the Dockerfile in a directory that git ignores (for example `<repo_path>/.repro/Dockerfile` after adding `.repro/` to `.git/info/exclude`, which is local and not committed). Do not add it to the repository.
3. Install dependencies from the lock file only: `pip install -r requirements.txt` with hashes or `uv sync --frozen`, `npm ci`, `go mod download`, `cargo fetch --locked`, `mvn -B dependency:go-offline`. Never `npm install` or unpinned `pip install` in the replica; that silently changes versions.
4. Set reported locale and zone in the image: `ENV LANG=<value> LC_ALL=<value> TZ=<value>`; install `tzdata` and `locales` packages and generate the locale on Debian-family images (`locale-gen` or `localedef`).
5. Do not `COPY` the source into the image; mount it at run time so edits are visible: `docker run --rm -it -v "<repo_path>":/src -w /src <tag> bash`.

### Output
Dockerfile and build command.

### Quality Gate
- `FROM` line contains `@sha256:`.
- The dependency install line uses a lock-respecting command from action 3.

---

## Phase 3: Build and Verify the Replica

### Entry Criteria
- Dockerfile written.

### Actions
1. Build: `docker build --platform <os/arch> -t repro-<short-name> -f .repro/Dockerfile .repro`.
2. Inside the container, rerun the Phase 1 capture commands from `repro-env-capture` for the stack and OS.
3. Compare each value with the reported column of `env_snapshot`. Fill the match table: field, reported, container, match (yes/no).
4. Record the image ID: `docker images --no-trunc --format '{{.ID}}' repro-<short-name>`.

### Output
`replica_recipe` with mode `container`.

### Quality Gate
- Every `env_diff` row with `could_affect_bug` == yes shows match == yes in the table, or is listed as an open mismatch with the reason.
- `docker run --rm repro-<short-name> <runtime> --version` output equals the reported runtime version.

---

## Worked Example

Illustrative only. `stack` = python; `env_diff` row: OS reported "Alpine 3.19", local Ubuntu 24.04, crash in a C extension, action `replicate in container`.

- Phase 1: one container row, `docker version` shows Server 27.x. Mode container.
- Phase 2: `docker pull python:3.12.4-alpine3.19`, digest recorded, `FROM python:3.12.4-alpine3.19@sha256:...`; `RUN pip install --require-hashes -r /src/requirements.lock` at run time through a mounted path.
- Phase 3: inside the container `python -VV` prints `Python 3.12.4 (main, ...) [GCC 13.2.1 ...]`, `ldd --version` prints `musl libc (x86_64)`. Match table shows libc musl == reported musl. Recipe stored.

---

## Exit Criteria

DONE when `replica_recipe` either lists the local switches to apply or gives a digest-pinned image whose captured environment matches every behavior-relevant reported field.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docker daemon not running | **Stop**: ask the user to start Docker Desktop or the `docker` service; do not fake the container with a local toolchain switch. |
| Phase 1 | Target architecture not available in buildx | **Adjust**: install emulation per Docker docs (`docker run --privileged --rm tonistiigi/binfmt --install <arch>`) or use a native machine of that architecture. |
| Phase 2 | No official image for the reported runtime version | **Adjust**: use the reported OS base image and install the runtime from its official release archive; record the URL and checksum. |
| Phase 3 | Container value still differs from reported | **Retry**: fix the Dockerfile for that field; if impossible, record the open mismatch and continue. |
| Any | Weak model commits the Dockerfile to the repo | **Stop**: remove it from the index; replicas are local tooling unless the team asks for them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
