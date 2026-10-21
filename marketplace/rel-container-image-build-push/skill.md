# Reproducible Container Image Build and Push

**One-line description:** Builds a multi-platform OCI image from the release tag with Docker Buildx, a digest-pinned base image, `SOURCE_DATE_EPOCH` and `rewrite-timestamp=true`, rebuilds it locally to confirm the same digest, then pushes once and records the image index digest that every later step must use instead of the tag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root containing the `Dockerfile`.
- `release_tag` (object, required): Tag name and commit SHA.
- `image_repository` (string, required): Registry repository, for example `ghcr.io/acme/parser`.

---

## Outputs

- `image_digest` (object): `repository`, `digest` (`sha256:...` of the image index), `tags` pushed, and platforms.
- `container_repro_report` (object): Digests of the two local builds, `identical`, BuildKit version, and causes of any difference.

---

## Phase 1: Pin Inputs

### Entry Criteria
- `docker buildx version` works. `docker buildx inspect --bootstrap` shows a builder with the `docker-container` driver (the default `docker` driver cannot export multi-platform OCI output). Create one if needed: `docker buildx create --name rel --driver docker-container --use`.

### Actions
1. Read the BuildKit version from `docker buildx inspect --bootstrap` (`BuildKit version:` line). `rewrite-timestamp` needs BuildKit v0.13 or later per the BuildKit reproducible builds documentation; if older, update the builder image.
2. Pin every `FROM` by digest. For each base: `docker buildx imagetools inspect python:3.12-slim --format '{{json .Manifest.Digest}}'`, then write `FROM python:3.12-slim@sha256:<digest>`. A tag alone (`python:3.12-slim`) changes under you.
3. Identify non-pinned network installs in the Dockerfile (`apt-get install` without versions, `pip install` without a lockfile, `curl | sh`). Record each; they break reproducibility. The fix (version pins, snapshot mirrors such as `snapshot.debian.org`, lockfiles) goes in a later release commit, not in the tagged Dockerfile.
4. `export SOURCE_DATE_EPOCH=$(git log -1 --format=%ct <tag>)`.

### Output
Pinned base list and risk list.

### Quality Gate
- `grep -E '^FROM' Dockerfile` shows `@sha256:` on every line (or the unpinned ones are listed as risks).
- BuildKit version is recorded and is at least the version required for `rewrite-timestamp`.

---

## Phase 2: Build Twice Locally

### Entry Criteria
- Inputs pinned. Working directory is a clean checkout of the tag.

### Actions
1. Build A without pushing, to an OCI archive:
   `docker buildx build --platform linux/amd64,linux/arm64 --build-arg SOURCE_DATE_EPOCH --output type=oci,dest=/tmp/img-a.tar,rewrite-timestamp=true --provenance=false --sbom=false --no-cache .`
   Provenance and SBOM attestations contain build timestamps, so they are off for the comparison build only.
2. Build B the same way to `/tmp/img-b.tar`, also with `--no-cache` so the cache cannot make B a copy of A.
3. Read each index digest: `mkdir a b && tar -xf /tmp/img-a.tar -C a && tar -xf /tmp/img-b.tar -C b && jq -r '.manifests[0].digest' a/index.json b/index.json`.
4. If they differ, run `diffoscope /tmp/img-a.tar /tmp/img-b.tar` and record which layer and file differ (common: package manager logs and caches under `/var/log`, `/var/cache`, `__pycache__` files with embedded mtimes).

### Output
`container_repro_report`.

### Quality Gate
- Both digests are recorded; `identical` is true or a diffoscope-backed cause is listed per differing layer.

---

## Phase 3: Push and Record the Digest

### Entry Criteria
- Phase 2 recorded. Logged in: `docker login <registry>` (in GitHub Actions use `docker/login-action@v3` with `GITHUB_TOKEN` for GHCR and `packages: write`).

### Actions
1. Push with attestations on:
   `docker buildx build --platform linux/amd64,linux/arm64 --build-arg SOURCE_DATE_EPOCH --output type=image,name=<image_repository>:<tag>,push=true,rewrite-timestamp=true --provenance=mode=max --sbom=true --metadata-file /tmp/meta.json .`
2. Read the digest: `jq -r '."containerimage.digest"' /tmp/meta.json`. In GitHub Actions, `docker/build-push-action@v6` exposes it as `steps.<id>.outputs.digest`.
3. Confirm the registry holds it: `docker buildx imagetools inspect <image_repository>@<digest>` lists both platforms.
4. Add more tags (for example `1.9`, `latest`) to the same digest without rebuilding: `docker buildx imagetools create -t <image_repository>:1.9 <image_repository>@<digest>`.
5. Every later step (provenance, cosign, deployment manifests) uses `<image_repository>@<digest>`, never `:<tag>`. Tags are mutable.

### Output
`image_digest`.

### Quality Gate
- `docker buildx imagetools inspect <image_repository>:<tag> --format '{{json .Manifest.Digest}}'` prints the same digest as `/tmp/meta.json`.
- The inspect output lists every platform requested.

---

## Worked Example

Illustrative. `image_repository` = `ghcr.io/acme/parser`, tag `v1.9.0`, BuildKit v0.16.

- Phase 1: `FROM python:3.12-slim` rewritten to `FROM python:3.12-slim@sha256:2b0079...`; `apt-get install -y curl` recorded as a risk.
- Phase 2: `jq -r '.manifests[0].digest' a/index.json b/index.json` prints `sha256:51c3...` twice: identical.
- Phase 3: `/tmp/meta.json` gives `"containerimage.digest": "sha256:a9e0..."` (differs from Phase 2 because provenance and SBOM are attached). `imagetools inspect ghcr.io/acme/parser:v1.9.0` shows the same `sha256:a9e0...` with `linux/amd64` and `linux/arm64`.

---

## Exit Criteria

DONE when the image is pushed once from the tag, its index digest is recorded from build metadata and matches the registry, the local double build result is recorded, and downstream steps receive the digest.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `docker` driver in use (multi-platform export unsupported) | **Adjust**: create a `docker-container` builder and select it with `--use`. |
| Phase 1 | `rewrite-timestamp` rejected as unknown | **Adjust**: update the BuildKit builder image; do not drop the option silently. |
| Phase 2 | Digests differ | **Return**: record the layer and file; push only after the user accepts the known cause. |
| Phase 3 | `denied: permission_denied` on push | **Adjust**: token needs `packages: write` (GHCR) or the registry's push scope. |
| Phase 3 | Tag already points to another digest | **Stop**: never overwrite a release tag; investigate which build pushed it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
