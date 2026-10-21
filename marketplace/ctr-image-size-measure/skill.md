# Measure and Attribute Image Size

**One-line description:** Measures an image's uncompressed size with `docker image inspect`, its compressed registry size from the manifest with `docker buildx imagetools inspect --raw`, attributes bytes to layers with `docker history`, finds wasted bytes with `dive`, and gates on user-supplied limits through `dive --ci` rules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `image_name` (string, required): Local image name; `:dev` is measured.
- `project_dir` (string, required): Repository root, where a `.dive-ci` file is written if limits are given.
- `size_limits` (object, optional): User-chosen limits: `lowestEfficiency`, `highestWastedBytes`, `highestUserWastedPercent` (dive CI rule names), and an optional max uncompressed size. Empty means report only.

---

## Outputs

- `size_report` (object): Uncompressed bytes, compressed bytes per platform, top layers by size with their instruction, dive efficiency and wasted bytes, files responsible for waste, and pass/fail against `size_limits`.

---

## Phase 1: Measure Totals

### Entry Criteria
- `<image_name>:dev` exists locally: `docker image ls <image_name>:dev` shows it.

### Actions
1. Uncompressed size in bytes: `docker image inspect -f '{{.Size}}' <image_name>:dev`. Record the integer. (`docker image ls` rounds and, with the containerd image store, can show a different "content size"; use `inspect` as the number of record.)
2. Compressed size (what is pulled over the network) needs a registry or OCI layout. If the image is pushed: `docker buildx imagetools inspect --raw <registry>/<image_name>@<digest>` returns the index; take a platform manifest digest and run it again on that digest; sum the `layers[].size` values: `docker buildx imagetools inspect --raw <ref>@<platform-digest> | jq '[.layers[].size] | add'`. If not pushed, record compressed size as "not measured" rather than estimating.
3. Record the base image size the same way (`docker image inspect -f '{{.Size}}' <runtime_ref>`), so the app's own contribution is the difference.

### Output
Total and base sizes.

### Quality Gate
- Every number is an integer copied from command output, labeled uncompressed or compressed.

---

## Phase 2: Attribute Bytes to Layers

### Entry Criteria
- Totals recorded.

### Actions
1. `docker history --no-trunc --format '{{.Size}}\t{{.CreatedBy}}' <image_name>:dev`. Sort mentally from largest; list the top five with their instruction.
2. Classify each large layer:

| Layer content | Typical cause | Fix (apply in the stack Dockerfile flow, not here) |
|---|---|---|
| `apt-get install` without cleanup | apt lists left behind; recommends pulled in | `--no-install-recommends` and `rm -rf /var/lib/apt/lists/*` in the same `RUN` |
| Compiler toolchain in runtime | single-stage build | move build to a builder stage |
| `COPY . .` in runtime | source, tests, docs shipped | copy only build output from the builder |
| `chown -R` layer roughly equal to a previous `COPY` | ownership change duplicates files | `COPY --chown` |
| Package manager caches (`/root/.cache/pip`, `/root/.npm`) | install without cache mount or `--no-cache-dir` | `--mount=type=cache` |
| Dev dependencies | full install copied to runtime | production-only install stage |

3. Run dive in CI mode for numbers: `CI=true dive <image_name>:dev`. Read `efficiency:` (percent), `wastedBytes:` and `userWastedPercent:`. Without `CI=true`, dive opens an interactive UI; in that UI, the bottom-left panel "Image Details" lists "Potential wasted space" and the files.
4. If dive is not installed, run it as a container: `docker run --rm -e CI=true -v /var/run/docker.sock:/var/run/docker.sock wagoodman/dive:latest <image_name>:dev`. Pin that tool image by digest if this goes into CI.
5. List files responsible for waste: in interactive dive, the "Image Details" table lists count, total space and path for files duplicated or deleted across layers.

### Output
Layer attribution table and dive metrics.

### Quality Gate
- The top layers list is copied from `docker history` output with sizes.
- dive's `efficiency`, `wastedBytes` and `userWastedPercent` lines are pasted.

---

## Phase 3: Gate on User Limits

### Entry Criteria
- Dive metrics recorded.

### Actions
1. If `size_limits` is empty, set the verdict to "report only" and finish. Do not invent thresholds; dive's own defaults are not a project policy.
2. Otherwise write `<project_dir>/.dive-ci` with only the keys the user gave:
```
rules:
  lowestEfficiency: <user value>
  highestWastedBytes: <user value>
  highestUserWastedPercent: <user value>
```
3. Run `CI=true dive --ci-config <project_dir>/.dive-ci <image_name>:dev`. Read each rule line: `PASS: lowestEfficiency` or `FAIL: lowestEfficiency`. Exit code is non-zero if any rule fails.
4. Compare uncompressed bytes to the user's max size if given.
5. Do NOT "fix" a failing gate by raising the limit. Report the failing rule and the layer responsible from Phase 2.

### Output
`size_report` with gate results.

### Quality Gate
- With limits: the `PASS`/`FAIL` lines and dive's exit code are pasted.
- Without limits: the report says "report only".

---

## Worked Example

Illustrative. `orders-api:dev`, Python slim runtime.

Phase 1: `docker image inspect -f '{{.Size}}'` prints `198442113`; base `python:3.12-slim-bookworm` prints `130994002`; app adds about 67 MB. Not pushed; compressed "not measured".

Phase 2: `docker history` top layer `61.2MB  COPY /opt/venv /opt/venv # buildkit`; second `5.3MB COPY /app /app`. dive: `efficiency: 99.21 %`, `wastedBytes: 1622016 bytes (1.6 MB)`, `userWastedPercent: 1.10 %`. Waste is `/usr/local/lib/python3.12/__pycache__` duplicates in the base.

Phase 3: user limits `lowestEfficiency: 0.95`, `highestUserWastedPercent: 0.05`. Output `PASS: highestUserWastedPercent`, `PASS: lowestEfficiency`, exit 0.

---

## Exit Criteria

DONE when uncompressed size, layer attribution and dive metrics are recorded from command output, and the image is gated on user limits or marked report only.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Image not found locally | **Retry**: build it or `docker pull` it, then rerun. |
| Phase 2 | dive fails with `cannot fetch image` under containerd image store | **Adjust**: save and analyze the archive: `docker save <image_name>:dev -o img.tar` then `dive --source docker-archive img.tar`. |
| Phase 3 | A rule fails | **Return**: report the rule and the responsible layer to the Dockerfile flow; do not edit limits. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
