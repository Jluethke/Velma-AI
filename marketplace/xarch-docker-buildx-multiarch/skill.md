# Build a Multi-Arch Docker Image with buildx for arm64

**One-line description:** Builds a `linux/arm64` image (optionally alongside `linux/amd64` as a single manifest list) with `docker buildx`, using a `docker-container` builder and the registered QEMU binfmt handler for emulated stages, and confirms the pushed manifest lists an arm64 entry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Path to the build context that holds the `Dockerfile`.
- `image_ref` (string, required): The target image reference, for example `registry.example.com/app:1.0`. This flow runs when it is set.
- `binfmt_state` (object, required): Output of `xarch-qemu-binfmt-register`, so emulated arm64 stages run on an x86-64 host.

---

## Outputs

- `image_digest` (object): The pushed manifest digest and the per-platform digests.
- `buildx_report` (object): The builder used, the platforms built, and the manifest inspection result.

---

## Phase 1: Create a buildx Builder

### Entry Criteria
- `docker buildx version` works and `binfmt_state` shows the arm64 handler is enabled.

### Actions
1. The default `docker` driver cannot build multi-platform images or export a manifest list. Create a `docker-container` builder: `docker buildx create --name xbuilder --driver docker-container --use`.
2. Bootstrap it: `docker buildx inspect --bootstrap`. The inspect output lists the platforms the builder can produce; it must include `linux/arm64`. If arm64 is absent, the binfmt handler is not visible to the builder; re-run `xarch-qemu-binfmt-register` with the `container` mode.
3. Prefer multi-stage builds that do the heavy compilation in a stage pinned to the build arch with `--platform=$BUILDPLATFORM` and cross-compile into arm64, so only the minimal final stage runs emulated. Emulated compilation is slow and occasionally miscompiles; cross-compiling in a native stage avoids both.
4. Do not build on the default builder and expect `--platform linux/arm64,linux/amd64` to work; it errors with `multiple platforms feature is currently not supported for docker driver`.

### Output
A bootstrapped `docker-container` builder.

### Quality Gate
- `docker buildx inspect --bootstrap` lists `linux/arm64` in the platforms line.
- `docker buildx ls` shows `xbuilder` with status running.

---

## Phase 2: Build, Push, Inspect the Manifest

### Entry Criteria
- The builder lists arm64.

### Actions
1. Build and push. A manifest list must be pushed to a registry; it cannot be loaded into the local daemon with `--load` when more than one platform is built:

```
docker buildx build \
  --platform linux/arm64 \
  -t "$image_ref" \
  --push \
  "$project_dir"
```

For a combined image use `--platform linux/arm64,linux/amd64`.
2. Inspect the pushed manifest: `docker buildx imagetools inspect "$image_ref"`. It must list a manifest with `Platform: linux/arm64`.
3. Record the top-level digest and the per-platform digests in `image_digest`.
4. Do not use `--load` with two platforms; load one platform at a time, or push the manifest list and pull per platform.
5. Do not tag an arm64-only build as if it were multi-arch; if only arm64 was built, say so in the report.

### Output
`image_digest`, `buildx_report`.

### Quality Gate
- `docker buildx imagetools inspect "$image_ref"` shows a `linux/arm64` platform entry.
- `image_digest` records a digest for the arm64 manifest.

---

## Worked Example

Illustrative. `project_dir` = `.`, `image_ref` = `ghcr.io/acme/app:1.0`.

```
$ docker buildx create --name xbuilder --driver docker-container --use
$ docker buildx inspect --bootstrap | grep Platforms
Platforms: linux/amd64, linux/arm64, ...
$ docker buildx build --platform linux/arm64,linux/amd64 -t ghcr.io/acme/app:1.0 --push .
$ docker buildx imagetools inspect ghcr.io/acme/app:1.0
Manifests:
  Platform: linux/amd64
  Platform: linux/arm64
```

`image_digest` = `{ "manifest": "sha256:...", "arm64": "sha256:..." }`.

---

## Exit Criteria

DONE when the manifest inspection lists a `linux/arm64` entry and its digest is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | arm64 absent from the platforms line | **Return**: run `xarch-qemu-binfmt-register` in `container` mode, then re-inspect. |
| Phase 1 | `docker driver` multi-platform error | **Adjust**: create and use a `docker-container` builder. |
| Phase 2 | `--load` with two platforms fails | **Adjust**: push to a registry, or `--load` one platform at a time. |
| Phase 2 | Emulated build step miscompiles | **Adjust**: move compilation into a `$BUILDPLATFORM` stage and cross-compile into the arm64 stage. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
