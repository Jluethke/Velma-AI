# Pin Base Images by Digest

**One-line description:** Resolves each base image tag to its multi-platform index digest with `docker buildx imagetools inspect` (or `crane digest`, `skopeo inspect`), writes `FROM image:tag@sha256:...` references, and sets up an update path (Renovate or Dependabot) so the pin does not silently go stale.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `base_image_plan` (object, required): From `ctr-base-image-select`.
- `libc_verdict` (object, required): From `ctr-alpine-musl-check`. Must not be `fail`.

---

## Outputs

- `pinned_bases` (object): `builder_ref` and `runtime_ref` as `repo:tag@sha256:<digest>`, `platforms` (list the index covers), `resolved_at` (UTC timestamp), `update_tool` (`renovate`, `dependabot`, or `manual` with the command to rerun).

---

## Phase 1: Resolve Index Digests

### Entry Criteria
- `libc_verdict.status` is `pass` or `not_applicable`.

### Actions
1. For each image, resolve the digest of the tag as the registry serves it:
   ```
   docker buildx imagetools inspect python:3.12-slim-bookworm
   ```
   Read the top block:
   ```
   Name:      docker.io/library/python:3.12-slim-bookworm
   MediaType: application/vnd.oci.image.index.v1+json
   Digest:    sha256:<64 hex>
   ```
   Alternatives that print only the digest: `crane digest python:3.12-slim-bookworm` or `skopeo inspect --format '{{.Digest}}' docker://docker.io/library/python:3.12-slim-bookworm`.
2. Pin the INDEX digest (MediaType `...image.index...` or `...manifest.list...`), not a single-platform manifest digest listed under `Manifests:`. The index digest keeps multi-arch builds working; a platform digest forces one architecture on every builder.
3. Record the platforms listed under `Manifests:` (lines `Platform: linux/amd64`, `linux/arm64`, ...). Ignore entries with `Platform: unknown/unknown`; those are attestation manifests.
4. Do NOT use `docker images --digests` or `docker inspect` `RepoDigests` from a locally pulled image as the source; they can show a stale local copy. Resolve from the registry.
5. Do NOT type or shorten a digest by hand. Copy all 64 hex characters.

### Output
Digest and platform list per image.

### Quality Gate
- Each digest is exactly `sha256:` plus 64 hex characters, copied from command output.
- Each pinned digest is an index digest (`MediaType` line pasted) or the image is single-platform and that is recorded.

---

## Phase 2: Write Pins and Verify

### Entry Criteria
- Digests resolved.

### Actions
1. Write each reference as `repo:tag@sha256:<digest>`. Keep the tag: Docker ignores it for pulling when a digest is present, but humans and update bots read it.
   ```
   FROM python:3.12-slim-bookworm@sha256:<digest> AS build
   ```
2. If the Dockerfile uses build args for base names, pin there instead and keep one source of truth:
   ```
   ARG PYTHON_IMAGE=python:3.12-slim-bookworm@sha256:<digest>
   FROM ${PYTHON_IMAGE} AS build
   ```
   `ARG` before the first `FROM` is visible only to `FROM` lines.
3. Verify each reference pulls on every required platform:
   ```
   docker pull --platform linux/amd64 python:3.12-slim-bookworm@sha256:<digest>
   docker pull --platform linux/arm64 python:3.12-slim-bookworm@sha256:<digest>
   ```
4. Also pin images used in `COPY --from=<image>` lines (for example `COPY --from=ghcr.io/astral-sh/uv:0.5.11@sha256:<digest> /uv /bin/`), and images in `compose.yaml` `image:` keys.

### Output
Pinned references written into `pinned_bases`.

### Quality Gate
- `grep -nE '^FROM|COPY --from=[a-z0-9.-]+[/:]' Dockerfile` shows every external image with `@sha256:`.
- `docker pull --platform` succeeds for each platform in `platforms`.

---

## Phase 3: Configure Updates

### Entry Criteria
- Pins verified.

### Actions
1. Pick the update tool by what the repo already uses:

| Repo state | Action |
|---|---|
| `renovate.json`, `.renovaterc*` or `.github/renovate.json5` exists | Ensure the `docker` manager is not disabled; Renovate updates both tag and digest by default for `tag@digest` references. Optionally add `"pinDigests": true` in a `packageRules` entry for `matchDatasources: ["docker"]`. |
| `.github/dependabot.yml` exists | Add an entry `package-ecosystem: "docker"`, `directory: "/"`, with a `schedule.interval` the user chooses. |
| Neither | Set `update_tool=manual`; record the Phase 1 command as the refresh procedure and ask the user how often to run it. |

2. Do NOT invent an update interval. It is a user input or an existing repo setting.
3. Validate config syntax: Renovate config with `npx --yes --package renovate -- renovate-config-validator`; Dependabot YAML with `python -c "import yaml,sys; yaml.safe_load(open('.github/dependabot.yml'))"`.

### Output
`pinned_bases` with `update_tool`.

### Quality Gate
- The validator command in step 3 exits 0, or `update_tool=manual` with the refresh command recorded.

---

## Worked Example

Illustrative.

Phase 1: `docker buildx imagetools inspect gcr.io/distroless/static-debian12:nonroot` prints `MediaType: application/vnd.oci.image.index.v1+json`, `Digest: sha256:6ec5...` (full 64 hex in the real record) and platforms `linux/amd64`, `linux/arm64`, `linux/arm`, `linux/s390x`, `linux/ppc64le`.

Phase 2: Dockerfile line `FROM gcr.io/distroless/static-debian12:nonroot@sha256:6ec5... AS runtime`. Both `docker pull --platform` commands print `Status: Downloaded newer image`.

Phase 3: repo has `renovate.json` with `"extends": ["config:recommended"]`; docker manager enabled. Validator prints `Config validated successfully`.

---

## Exit Criteria

DONE when every external image reference in the Dockerfile (and compose file, if any) carries a registry-resolved index digest that pulls on every required platform, and an update path is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `libc_verdict.status` is `fail` | **Stop**: return to `ctr-base-image-select`. |
| Phase 1 | Registry requires login | **Retry**: `docker login <registry>` then rerun; never pin from a cached local image. |
| Phase 2 | `no matching manifest for linux/arm64` | **Adjust**: record the image as amd64-only and tell the user; do not swap in a different image silently. |
| Phase 3 | Validator fails | **Adjust**: fix the reported key, rerun the validator. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
