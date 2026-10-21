# Order Layers for Build Cache Hits

**One-line description:** Audits a Dockerfile's instruction order and BuildKit cache usage by touching a source file and reading which steps print `CACHED` in `docker build --progress=plain`, then reorders so that only the source and build steps rerun, adds `--mount=type=cache` for package managers, and configures registry or GitHub Actions cache export for CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Build context with the Dockerfile.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies lockfile and package manager.
- `image_name` (string, required): Local image name, for example `orders-api`.

---

## Outputs

- `cache_report` (object): Steps that rebuilt after a source-only change (before and after reordering), cache mounts added, the CI cache flags chosen, and wall time of the warm rebuild as printed by BuildKit.

---

## Phase 1: Measure Cache Behavior

### Entry Criteria
- `docker build -t <image_name>:dev <project_dir>` succeeds.

### Actions
1. Warm the cache: `docker build --progress=plain -t <image_name>:dev <project_dir>`.
2. Change one application source file without changing behavior: append a comment line to a source file and record the file. (You will revert it in step 5.)
3. Rebuild and save the log: `docker build --progress=plain -t <image_name>:dev <project_dir> 2>&1 | tee /tmp/cache-run.log`.
4. Read the log. Each step prints `#N [stage k/m] <instruction>` then either `#N CACHED` or execution lines and `#N DONE <seconds>s`. List every step that did NOT print `CACHED`.
5. Revert the comment: `git checkout -- <file>` (or remove the line by hand if the repo is not a git checkout).
6. Classify each rebuilt step:

| Rebuilt step | Expected after a source-only change? |
|---|---|
| `COPY . .`, `COPY src ...`, compile/build step, later `COPY --from=build` | Yes |
| Dependency install (`npm ci`, `uv sync`, `pip install`, `go mod download`, `mvn dependency:go-offline`) | No: cache bust, fix in Phase 2 |
| `apt-get install`, `apk add` | No: fix in Phase 2 |

### Output
List of steps that rebuilt unexpectedly.

### Quality Gate
- `/tmp/cache-run.log` exists and the rebuilt step list is copied from it, with `#N` step numbers.
- The source file change is reverted (`git status --short` shows it clean).

---

## Phase 2: Reorder and Add Cache Mounts

### Entry Criteria
- At least one unexpected rebuild, or no cache mounts on dependency installs.

### Actions
1. Reorder each stage to this sequence, least-changing first:
   1. `FROM` and `ARG`/`ENV` that never change.
   2. OS packages (`apt-get`/`apk`) in ONE `RUN` that also cleans: `rm -rf /var/lib/apt/lists/*`.
   3. `COPY` of manifest and lockfile only.
   4. Dependency install.
   5. `COPY` of source.
   6. Build/compile.
2. Do NOT put `ARG` lines that change every build (for example `ARG GIT_SHA`) above the dependency install. Any change to an ARG value invalidates every following `RUN` that uses it, and BuildKit treats a declared ARG in scope as part of later `RUN` cache keys. Declare such ARGs right before the step that uses them.
3. Add a cache mount to each dependency install. Targets: npm `/root/.npm`; pip `/root/.cache/pip`; uv `/root/.cache/uv`; Go `/go/pkg/mod` and `/root/.cache/go-build`; Maven `/root/.m2`; Gradle `/root/.gradle`; apt `/var/cache/apt` plus `/var/lib/apt` with `sharing=locked`. For apt in Debian images, also remove `/etc/apt/apt.conf.d/docker-clean` in the same `RUN` or the cache stays empty; this is the pattern in the Dockerfile reference for `RUN --mount=type=cache`.
4. If the build runs as a non-root user, add `uid=<uid>` to the cache mount options so the user can write to it.
5. Edit only the Dockerfile. One reorder at a time, rebuild after each move.
6. Rerun Phase 1 steps 2 to 5 and record the new rebuilt list.

### Output
Reordered Dockerfile.

### Quality Gate
- In the new log, every dependency install step prints `CACHED` after a source-only change.
- `docker build` still exits 0 and the image still starts (`docker run --rm <image_name>:dev` reaches its startup log line).

---

## Phase 3: CI Cache Export

### Entry Criteria
- Local cache behavior fixed.

### Actions
1. CI runners start with an empty cache, so export it. Choose by CI system:

| CI | Flags |
|---|---|
| GitHub Actions with `docker/build-push-action` | `cache-from: type=gha` and `cache-to: type=gha,mode=max` |
| Any CI with a registry | `--cache-from type=registry,ref=<registry>/<image_name>:buildcache --cache-to type=registry,ref=<registry>/<image_name>:buildcache,mode=max` |
| Local only | none needed |

2. `mode=max` exports layers of all stages (including builder); `mode=min` (the default) exports only the final image's layers, which misses the dependency stage. Use `max` for multi-stage builds.
3. The `docker` driver cannot export cache to a registry or `gha`. Create a builder first: `docker buildx create --name ci --driver docker-container --use`.
4. Cache mounts (`--mount=type=cache`) are NOT exported by `--cache-to`. Record this so nobody expects them on a fresh runner.

### Output
`cache_report`.

### Quality Gate
- A second CI run (or a local run after `docker buildx prune -af` with `--cache-from`) shows `importing cache manifest from` and `CACHED` on dependency steps.

---

## Worked Example

Illustrative. Node image; original Dockerfile has `COPY . .` then `RUN npm ci`.

Phase 1: after appending a comment to `src/routes.ts`, log shows `#9 [deps 3/4] RUN npm ci` executing with `#9 DONE 48.2s`. Unexpected rebuild.

Phase 2: move `COPY package.json package-lock.json ./` and `RUN --mount=type=cache,target=/root/.npm npm ci` above `COPY . .`. New log: `#9 CACHED`; only `COPY . .` and `npm run build` run; total `DONE 7.4s`.

Phase 3: GitHub Actions with `cache-to: type=gha,mode=max`. Second workflow run log: `importing cache manifest from gha:...`, `#9 CACHED`.

---

## Exit Criteria

DONE when a source-only change rebuilds only source and build steps (shown by `CACHED` lines), dependency installs use cache mounts, and CI cache export is configured or recorded as not needed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Nothing prints `CACHED` even with no change | **Adjust**: check for `--no-cache` in the command, a changing `ARG` default such as a timestamp, or `ADD <url>`; remove the cause and rerun. |
| Phase 2 | Reorder breaks the build (`file not found` during install) | **Adjust**: the install needs another file (for example a workspace `package.json` or `.npmrc` via secret); copy just that file before the install. |
| Phase 3 | `cache export feature is currently not supported for docker driver` | **Retry**: create a `docker-container` builder as in step 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
