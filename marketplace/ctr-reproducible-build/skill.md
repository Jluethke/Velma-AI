# Make the Image Build Reproducible

**One-line description:** Builds the image twice from clean caches with `SOURCE_DATE_EPOCH` and the BuildKit `rewrite-timestamp=true` exporter option, compares the resulting OCI digests, and when they differ uses `diffoci` to find the nondeterministic files and fixes their source (unpinned apt, unhashed pip, jar timestamps, Go VCS stamping).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Build context; must be a git checkout for `SOURCE_DATE_EPOCH`.
- `image_name` (string, required): Image name used for the two builds.
- `build_profile` (object, required): From `ctr-stack-inventory`; selects the stack fixes in Phase 3.

---

## Outputs

- `repro_report` (object): The two image digests, whether they match, the BuildKit and buildx versions, `SOURCE_DATE_EPOCH` value, every differing path found by `diffoci`, the fix for each, and the final match result.

---

## Phase 1: Set Up a Comparable Build

### Entry Criteria
- All base images are pinned by digest (`ctr-pin-base-digest`). Unpinned bases make two builds differ by design.
- `git status --short` is clean (uncommitted files change the context).

### Actions
1. Use a BuildKit container builder; the timestamp rewrite exporter option needs BuildKit 0.13 or later:
```
docker buildx create --name repro --driver docker-container --use
docker buildx inspect --bootstrap repro
```
   Read `BuildKit version:` from the inspect output and record it.
2. Derive the timestamp from the commit, not the clock: `export SOURCE_DATE_EPOCH=$(git -C <project_dir> log -1 --pretty=%ct)`.
3. Build twice, each with no cache, to OCI tarballs:
```
docker buildx build --no-cache --build-arg SOURCE_DATE_EPOCH \
  --output type=oci,dest=/tmp/a.tar,rewrite-timestamp=true <project_dir>
docker buildx build --no-cache --build-arg SOURCE_DATE_EPOCH \
  --output type=oci,dest=/tmp/b.tar,rewrite-timestamp=true <project_dir>
```
   BuildKit reads `SOURCE_DATE_EPOCH` as a build arg to set image config timestamps; `rewrite-timestamp=true` also clamps file mtimes in layers.
4. Add `--provenance=false` to both builds if provenance attestations are on; provenance includes build-time metadata that differs per run. Record this choice.

### Output
Two OCI tarballs.

### Quality Gate
- `BuildKit version:` line pasted and is 0.13 or later.
- Both builds exit 0.

---

## Phase 2: Compare

### Entry Criteria
- `/tmp/a.tar` and `/tmp/b.tar` exist.

### Actions
1. Compare manifest digests from the OCI index: `tar -xOf /tmp/a.tar index.json | jq -r '.manifests[0].digest'` and the same for `b.tar`. Equal digests mean the build is reproducible: record and finish this flow.
2. If different, find out why with `diffoci` (github.com/reproducible-containers/diffoci):
```
diffoci diff --semantic oci-archive:/tmp/a.tar oci-archive:/tmp/b.tar
```
   Check `diffoci --help` for the exact source syntax in your version. Read each reported path and field (`mtime`, file content, config `created`, history).
3. Group differences:

| Difference | Likely source |
|---|---|
| `created` or history timestamps | `SOURCE_DATE_EPOCH` not passed, or BuildKit too old |
| File mtimes only | `rewrite-timestamp=true` missing |
| `/var/lib/apt/lists/*`, `/var/log/apt/*`, `/var/cache/ldconfig/aux-cache` | apt metadata left in the image, or unpinned package mirror |
| `*.pyc` content | bytecode compiled with timestamp invalidation; set `SOURCE_DATE_EPOCH` in the stage that compiles |
| jar file content | jar entry timestamps or ordering |
| Go binary content | VCS stamping or paths |
| `node_modules/.package-lock.json` or build output with dates | build tools writing current time |

### Output
Match result or difference list.

### Quality Gate
- Both digests are pasted.
- If they differ, the `diffoci` output (or its relevant lines) is pasted and each path is grouped.

---

## Phase 3: Fix Sources of Nondeterminism

### Entry Criteria
- Difference list exists.

### Actions
1. Apply one fix at a time, then repeat Phases 1 and 2:
   - apt: delete metadata in the same `RUN` (`rm -rf /var/lib/apt/lists/* /var/log/apt /var/log/dpkg.log /var/cache/ldconfig/aux-cache`). For identical package versions over time, point apt at a snapshot (`snapshot.debian.org`); the reproducible-containers project publishes `repro-sources-list.sh` for this. Pinning packages (`pkg=version`) alone breaks when the mirror drops old versions.
   - Python: `pip install --require-hashes -r requirements.txt` (hashes from `pip-compile --generate-hashes` or `uv export`); `ENV SOURCE_DATE_EPOCH` in the build stage. When `SOURCE_DATE_EPOCH` is set, Python's `py_compile` defaults to hash-based `.pyc` files.
   - Node: `npm ci` from the lockfile is deterministic for package versions; check the build tool for embedded dates (for example a banner plugin).
   - Go: `-trimpath` and `-buildvcs=false` (or keep VCS stamping but build from the same commit; `.git` must be in the context for it to be stable). See `ctr-go-dockerfile`.
   - Java Maven: set `<project.build.outputTimestamp>` in `pom.xml` (Maven 3.8.1+ plugins honor it). Gradle: in `tasks.withType<AbstractArchiveTask>` set `isPreserveFileTimestamps = false` and `isReproducibleFileOrder = true`. These are build-file changes; make them only with user approval.
2. Do NOT "fix" a difference by deleting the file from comparison or by building once and copying the digest.
3. When the digests match, run the image once (`docker load`/`docker run` or the smoke flow) to confirm the fix did not break startup.

### Output
`repro_report`.

### Quality Gate
- Final two digests are equal and pasted, or each remaining difference is listed with why it cannot be fixed now.

---

## Worked Example

Illustrative. Python slim image.

Phase 1: `BuildKit version: v0.16.0`; `SOURCE_DATE_EPOCH=1760918400`.

Phase 2: digests `sha256:9a1f...` and `sha256:4c07...` differ. `diffoci` reports content differences in `var/cache/ldconfig/aux-cache` and `var/log/apt/history.log`, and in `opt/venv/lib/python3.12/site-packages/.../__pycache__/*.pyc`.

Phase 3: added the apt cleanup paths and `ENV SOURCE_DATE_EPOCH` to the build stage via `ARG SOURCE_DATE_EPOCH`. Rebuild: both digests `sha256:b2e8...`. Smoke run starts normally.

---

## Exit Criteria

DONE when two clean builds of the same commit produce the same image digest, or every remaining difference is listed with its cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rewrite-timestamp` unknown | **Adjust**: upgrade buildx/BuildKit (`docker buildx create --driver-opt image=moby/buildkit:<version>`), rerun. |
| Phase 1 | Base images not pinned | **Return**: to `ctr-pin-base-digest`. |
| Phase 2 | `diffoci` not installed | **Stop**: install it from its release page, or report "differs, cause not analyzed"; do not guess causes. |
| Phase 3 | Fix needs build-file changes the user has not approved | **Return**: list the change and wait for approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
