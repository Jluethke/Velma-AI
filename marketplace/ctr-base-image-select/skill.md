# Select Builder and Runtime Base Images

**One-line description:** Chooses the builder and runtime base images for a multi-stage build from a decision table (distroless, Debian slim, Alpine, scratch, or a vendor JRE), matched to the exact runtime version and native dependencies in the build profile, and records what each choice removes (shell, package manager, glibc).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `build_profile` (object, required): From `ctr-stack-inventory`.
- `base_preference` (string, optional): User override: `distroless`, `slim`, `alpine` or `scratch`. Empty means use the decision table.

---

## Outputs

- `base_image_plan` (object): `builder_image` (repo:tag), `runtime_image` (repo:tag), `libc` (`glibc` or `musl` or `none`), `has_shell` (bool), `has_package_manager` (bool), `default_user` (name and UID if the image defines one), `debug_variant` (tag with a shell, if any), `reason` (table row used).

---

## Phase 1: Apply the Decision Table

### Entry Criteria
- `build_profile.runtime_version` is an exact version (not a range). If it is a range, stop and get the answer first.

### Actions
1. Pick the runtime row. Use the first row whose condition is true.

| stack | Condition | runtime_image | builder_image |
|---|---|---|---|
| go | `native_deps` empty (no `import "C"`) | `gcr.io/distroless/static-debian12:nonroot` (or `scratch` if `base_preference=scratch`) | `golang:<go version>-bookworm` |
| go | cgo required | `gcr.io/distroless/base-debian12:nonroot` (glibc) | `golang:<go version>-bookworm` |
| python | always (default) | `python:<X.Y>-slim-bookworm` | same tag as runtime |
| python | `base_preference=distroless` and Debian 12 python3 minor equals `runtime_version` minor | `gcr.io/distroless/python3-debian12:nonroot` | `debian:12-slim` with `python3-venv` from apt, so the venv's interpreter path `/usr/bin/python3` exists in both stages |
| node | always (default) | `node:<major>-bookworm-slim` | same tag as runtime |
| node | `base_preference=distroless` | `gcr.io/distroless/nodejs<major>-debian12:nonroot` (only majors the project publishes; check the distroless README) | `node:<major>-bookworm-slim` |
| java | always (default) | `eclipse-temurin:<major>-jre-noble` or `-jre-jammy` (check Docker Hub tags) | `eclipse-temurin:<major>-jdk-noble` (same OS family) |
| java | `base_preference=distroless` | `gcr.io/distroless/java<major>-debian12:nonroot` | `eclipse-temurin:<major>-jdk` |
| any | `base_preference=alpine` | the `-alpine` variant of the default row | the `-alpine` variant; then `ctr-alpine-musl-check` MUST pass |

2. Do NOT choose Alpine for python by default. Many wheels on PyPI ship only `manylinux` (glibc) builds; with musl, pip falls back to compiling from source, which needs `gcc`, `musl-dev` and headers in the builder and is slower. Alpine is allowed only through `base_preference=alpine` plus the musl check.
3. Do NOT use `latest` or a bare major tag such as `python:3`. Use `<major>.<minor>` at minimum. The next flow pins the digest.
4. Verify every tag exists before writing it down:
   ```
   docker buildx imagetools inspect <image:tag>
   ```
   An error `not found` means the tag does not exist. Do not guess a nearby tag; list tags on the registry web page or with `crane ls <repo>` (go-containerregistry) if installed.
5. For the distroless python row, confirm the interpreter version: `docker run --rm gcr.io/distroless/python3-debian12 --version`. If its minor differs from `runtime_version`, fall back to the default slim row and record why.

### Output
Draft `builder_image` and `runtime_image`.

### Quality Gate
- `docker buildx imagetools inspect` succeeds for both images (paste the `Name:` and `Digest:` lines).
- No tag is `latest` or a major-only tag.

---

## Phase 2: Record What the Runtime Lacks

### Entry Criteria
- Both images resolved.

### Actions
1. Check for a shell: `docker run --rm --entrypoint /bin/sh <runtime_image> -c 'echo ok'`. `ok` means `has_shell=true`; `exec: "/bin/sh": stat /bin/sh: no such file` means false (expected for distroless and scratch).
2. Check for libc: `docker run --rm --entrypoint ls <runtime_image> /lib/ld-musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2` where `ls` exists; for distroless, read the image documentation (`static` = no libc, `base`/`cc`/`python3`/`java`/`nodejs` = glibc). On arm64, the loader names are `ld-musl-aarch64.so.1` and `ld-linux-aarch64.so.1`.
3. Record the default user: `docker image inspect -f '{{.Config.User}}' <runtime_image>`. Distroless `:nonroot` tags report `65532`. `node` images define user `node` UID 1000 but do not switch to it. Python and Temurin images run as root unless changed.
4. Record the debug variant if one exists: distroless offers `:debug` and `:debug-nonroot` tags with a busybox shell. Use it only for troubleshooting, never as the shipped image.
5. Write the consequences into `reason`: no shell means `HEALTHCHECK CMD-SHELL`, `RUN` and shell-form `CMD` are impossible in the runtime stage; every `CMD`/`ENTRYPOINT` must be exec form (JSON array).

### Output
`base_image_plan`.

### Quality Gate
- `has_shell` is backed by the pasted output of step 1.
- `default_user` is copied from `docker image inspect` output.

---

## Worked Example

Illustrative. `build_profile`: go 1.23, no `import "C"`. `base_preference` empty.

Phase 1: row "go, native_deps empty". `docker buildx imagetools inspect golang:1.23-bookworm` prints `Name: docker.io/library/golang:1.23-bookworm` and `Digest: sha256:...`. Same for `gcr.io/distroless/static-debian12:nonroot`.

Phase 2: `/bin/sh` check prints `stat /bin/sh: no such file or directory`; `has_shell=false`. `Config.User` = `65532`. libc `none` (static).

```json
{"builder_image":"golang:1.23-bookworm","runtime_image":"gcr.io/distroless/static-debian12:nonroot",
 "libc":"none","has_shell":false,"has_package_manager":false,"default_user":"nonroot 65532",
 "debug_variant":"gcr.io/distroless/static-debian12:debug-nonroot","reason":"go static row; exec-form CMD only"}
```

---

## Exit Criteria

DONE when both images are resolvable tags (not `latest`), and the plan states libc, shell, package manager and default user from command output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `runtime_version` is a range | **Stop**: return to `ctr-stack-inventory` open questions. |
| Phase 1 | Tag not found | **Adjust**: list real tags with `crane ls` or the registry page; pick the matching minor, never a guess. |
| Phase 1 | Distroless python minor differs from the project | **Adjust**: use the `python:<X.Y>-slim-bookworm` row and record the reason. |
| Phase 2 | `docker run` fails with `exec format error` | **Retry**: pass `--platform linux/amd64` or `linux/arm64` matching the host, and record the platform. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
