# Write and Verify a .dockerignore

**One-line description:** Writes a stack-specific `.dockerignore` that keeps secrets, VCS history, local dependency folders and build output out of the Docker build context, then measures the context size BuildKit actually transfers before and after.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root used as the build context.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies `stack`, `lockfile` and `build_command`.

---

## Outputs

- `dockerignore_report` (object): Path of the `.dockerignore` written, the patterns added grouped by reason, the context size before and after as printed by BuildKit, and any file that must stay in the context despite matching a pattern.

---

## Phase 1: Measure the Current Context

### Entry Criteria
- `build_profile.stack` is set.
- Docker with BuildKit is available: `docker buildx version` prints a version.

### Actions
1. Check whether `.dockerignore` already exists: `ls -la <project_dir>/.dockerignore`. If it exists, read it fully and keep every existing line. You will only append.
2. Check for a per-Dockerfile ignore file. BuildKit uses `<Dockerfile-name>.dockerignore` next to the Dockerfile (for example `Dockerfile.dockerignore`) in place of the root `.dockerignore` when present. If one exists, that is the file to edit.
3. Measure the context. Run a throwaway build of a stage that copies nothing, so the measurement does not depend on the Dockerfile being valid:
   ```
   docker build --progress=plain --no-cache -f - <project_dir> <<'EOF'
   FROM scratch
   COPY . /ctx
   EOF
   ```
   Read the line `transferring context: <N>MB` in the output. Record N as `context_before`.
   (PowerShell: write the two lines to a temporary file outside the project and pass it with `-f <path>`.)
4. List the largest top-level entries so you know what dominates: `du -sh <project_dir>/* <project_dir>/.[!.]* 2>/dev/null | sort -h | tail -20`.

### Output
`context_before` and the list of large entries.

### Quality Gate
- `context_before` is copied from a `transferring context:` line in real build output.
- The existing `.dockerignore` content (if any) is recorded verbatim before editing.

---

## Phase 2: Write the Patterns

### Entry Criteria
- Phase 1 complete.

### Actions
1. Add the common block. Each group is required:
   ```
   # VCS and editor
   .git
   .gitignore
   .idea
   .vscode
   *.swp
   # Secrets and local env (never send to the daemon)
   .env
   .env.*
   *.pem
   *.key
   id_rsa*
   .aws
   .npmrc
   .pypirc
   # Container files themselves
   Dockerfile*
   docker-compose*.yml
   compose*.yaml
   .dockerignore
   ```
2. Add the stack block from this table:

| stack | Patterns |
|---|---|
| python | `__pycache__/`, `*.py[cod]`, `.venv/`, `venv/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.tox/`, `.coverage`, `htmlcov/`, `dist/`, `build/`, `*.egg-info/` |
| node | `node_modules/`, `npm-debug.log*`, `.pnpm-store/`, `.yarn/cache`, `.next/cache`, `coverage/`, `dist/` only if the Dockerfile builds `dist` itself |
| go | `bin/`, `*.test`, `*.out`, `coverage.*`; keep `vendor/` if `build_profile` says vendored |
| java | `target/`, `build/`, `.gradle/`, `out/`, `*.class`, `.mvn/wrapper/maven-wrapper.jar` only if the Dockerfile downloads the wrapper jar |

3. Apply these if/then rules:
   - If the build runs `git describe` or reads `.git` (for example `setuptools-scm`, `hatch-vcs`, Go `-buildvcs`), then keep `.git` ignored and pass the version as a build arg (`--build-arg VERSION=$(git describe --tags)`), or for setuptools-scm set `SETUPTOOLS_SCM_PRETEND_VERSION`. Go: build with `-buildvcs=false`.
   - If tests run inside the image (`ctr-test-in-image`), then do NOT ignore `tests/`, `test/`, `src/test/` or `*_test.go`.
   - If a pattern excludes a file the Dockerfile `COPY`s, re-include it with `!path` on a line after the pattern. Later lines win.
4. Do NOT ignore the lockfile named in `build_profile.lockfile`. `npm ci`, `uv sync --frozen` and `go mod download` fail or drift without it.

### Output
Updated `.dockerignore`.

### Quality Gate
- `grep -n "<lockfile>" .dockerignore` returns nothing, or returns only a `!` re-include line.
- `.env` and `.git` appear in the file.

---

## Phase 3: Verify Context Contents

### Entry Criteria
- `.dockerignore` written.

### Actions
1. Rerun the Phase 1 step 3 command. Record `context_after` from the `transferring context:` line.
2. Inspect what actually got sent:
   ```
   docker build -q -t ctx-probe -f - <project_dir> <<'EOF'
   FROM busybox:stable
   COPY . /ctx
   CMD ["find", "/ctx", "-maxdepth", "2"]
   EOF
   docker run --rm ctx-probe
   docker image rm ctx-probe
   ```
3. Confirm none of these appear: `.git`, `.env`, `node_modules`, `.venv`, `target`. Confirm the lockfile and every path the Dockerfile `COPY`s do appear.

### Output
`dockerignore_report`.

### Quality Gate
- `docker run --rm ctx-probe` output contains no `.git` or `.env` path.
- `context_after` is less than or equal to `context_before`, both copied from build output.

---

## Worked Example

Illustrative. Node project, `build_profile.lockfile = package-lock.json`.

Phase 1: no `.dockerignore`. Output line `#5 transferring context: 412.38MB 6.1s`. `du` shows `node_modules` 398M, `.git` 11M.

Phase 2: common block plus `node_modules/`, `coverage/`, `npm-debug.log*`. `dist/` is NOT added because the Dockerfile runs `npm run build` and the repo has no committed `dist`.

Phase 3: `#5 transferring context: 1.94MB 0.1s`. `find /ctx -maxdepth 2` lists `/ctx/package.json`, `/ctx/package-lock.json`, `/ctx/src`, `/ctx/tsconfig.json`; no `.git`, no `node_modules`.

---

## Exit Criteria

DONE when `.dockerignore` excludes VCS, secrets and local build artifacts, keeps the lockfile and every `COPY` source, and both context sizes are recorded from real build output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `docker buildx version` fails | **Stop**: BuildKit is required by later flows; install Docker Engine 23+ or Docker Desktop. |
| Phase 2 | Build later fails with `COPY failed: file not found` | **Adjust**: add a `!path` re-include for that file after the excluding pattern, rerun Phase 3. |
| Phase 2 | Build needs `.git` for its version | **Adjust**: pass the version as a build arg; keep `.git` excluded. |
| Phase 3 | `.env` still visible in the probe | **Retry**: check for a `Dockerfile.dockerignore` overriding the root file, and for a `!` line re-including it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
