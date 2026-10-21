# Alpine musl Compatibility Check

**One-line description:** Decides whether a project can run on a musl-based Alpine image by checking binary interpreters with `file` and `ldd`, wheel availability for musllinux with `pip download`, native Node addons, and the known musl behavior differences (DNS, thread stack size, locale), and returns a pass, fail or not-applicable verdict.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies `stack`, `runtime_version`, `lockfile`, `native_deps`.
- `base_image_plan` (object, required): From `ctr-base-image-select`; supplies `libc` and image names.

---

## Outputs

- `libc_verdict` (object): `status` (`not_applicable`, `pass`, `fail`), `evidence` (command lines and their output), `blocking_packages` (list), `required_builder_packages` (apk package names), `runtime_risks` (list of musl behavior differences that apply).

---

## Phase 1: Decide Applicability

### Entry Criteria
- `base_image_plan.libc` is set.

### Actions
1. If `base_image_plan.libc` is `glibc` or `none`, set `status=not_applicable`, put the libc value in `evidence`, and finish. Do not run the remaining phases.
2. If `libc` is `musl`, confirm it: `docker run --rm <runtime_image> sh -c 'ls /lib/ld-musl-*'`. Expect a path like `/lib/ld-musl-x86_64.so.1`.

### Output
Applicability decision.

### Quality Gate
- `status=not_applicable` is set only when `libc` is `glibc` or `none`, with that value quoted in `evidence`.
- For musl, the `ls /lib/ld-musl-*` output is pasted.

---

## Phase 2: Check Dependencies Against musl

### Entry Criteria
- `libc` is `musl`.

### Actions
1. Python: test whether every locked dependency has a musl wheel, without installing anything:
   ```
   docker run --rm -v <project_dir>:/src -w /src python:<X.Y>-alpine sh -c \
     "pip download --only-binary=:all: --dest /tmp/w -r requirements.txt"
   ```
   For uv projects first export pins: `uv export --frozen --no-dev --format requirements-txt > /tmp/req.txt` and use that file. For poetry, use the `poetry export` command if the export plugin is installed (check `poetry export --help`).
   Read the output: `ERROR: Could not find a version that satisfies the requirement X` under `--only-binary=:all:` means X has no musllinux wheel for this Python version and must compile from source. Add X to `blocking_packages`.
2. For each blocking Python package, run the same command without `--only-binary` in a container with build tools to see whether it compiles:
   ```
   docker run --rm -v <project_dir>:/src -w /src python:<X.Y>-alpine sh -c \
     "apk add --no-cache build-base && pip wheel --no-deps --wheel-dir /tmp/w <package>==<version>"
   ```
   Compiler errors naming a missing header (for example `libpq-fe.h`, `ffi.h`, `openssl/ssl.h`) tell you the `-dev` apk package: `postgresql-dev`, `libffi-dev`, `openssl-dev`. Record them in `required_builder_packages`; the runtime then needs the matching non-dev library (`libpq`, `libffi`, `openssl`).
3. Node: list native addons: `find node_modules -name '*.node' -not -path '*/test/*'` after `npm ci` in a glibc container, then `npm ci` inside `node:<major>-alpine`. A package that prints `prebuild-install warn install No prebuilt binaries found` and then fails `node-gyp` needs `apk add --no-cache python3 make g++` in the builder. Record it.
4. Go with cgo: musl builds work but must be built in an Alpine builder (`golang:<ver>-alpine` plus `apk add build-base`). A cgo binary built on Debian will not run on Alpine.
5. Java: the JDK/JRE itself must be a musl build. Use `eclipse-temurin:<major>-jre-alpine`; a glibc JRE copied into Alpine fails with `not found` on exec.
6. Check any prebuilt binary the Dockerfile downloads (CLI tools, agents): `file <binary>`. Output containing `interpreter /lib64/ld-linux-x86-64.so.2` means glibc-only; it will fail on Alpine with the misleading message `not found`. Add it to `blocking_packages`.

### Output
`blocking_packages` and `required_builder_packages`.

### Quality Gate
- Each entry in `blocking_packages` has the exact error line pasted from command output.
- Each `required_builder_packages` entry is tied to a compiler error naming a missing header or library.

---

## Phase 3: Record Runtime Behavior Risks and Decide

### Entry Criteria
- Phase 2 complete.

### Actions
1. Add each applicable risk to `runtime_risks`, citing the musl or tool documentation:
   - DNS: musl's resolver queries nameservers in parallel and, before musl 1.2.4, had no TCP fallback for large responses. Check the musl version: `docker run --rm <runtime_image> sh -c 'ldd 2>&1 | head -2'` prints `musl libc (x86_64) Version 1.2.x`.
   - Thread stack size: musl's default thread stack is much smaller than glibc's. Deep recursion in native threads (Python C extensions, JNI) can segfault. Mark this a risk if `native_deps` is not empty.
   - Locale: musl has limited locale support; `locale.setlocale` with non-C locales may behave differently.
   - Python performance: interpreters and wheels compiled for musl can be slower than glibc builds; measure with the project's own benchmark if one exists, do not assume.
2. Decide:

| Condition | status |
|---|---|
| `blocking_packages` empty, no glibc-only binaries | `pass` |
| Blocking packages all compile with recorded builder packages, and the user accepts longer builds | `pass` with `required_builder_packages` |
| Any glibc-only prebuilt binary, or a package that fails to compile | `fail` |

3. If `fail`, recommend switching `base_image_plan` to the Debian slim or distroless row from `ctr-base-image-select`. Do NOT add `gcompat` or `libc6-compat` as a fix without running the project's full test suite on the result; these shims are partial.

### Output
`libc_verdict`.

### Quality Gate
- `status` matches a row of the step 2 table.
- Every `runtime_risks` entry names its source (musl version output, documentation).

---

## Worked Example

Illustrative. `base_preference=alpine`, python 3.12, `requirements.txt` pins `psycopg2==2.9.9`, `orjson==3.10.7`.

Phase 1: `ls /lib/ld-musl-*` prints `/lib/ld-musl-x86_64.so.1`.

Phase 2: `pip download --only-binary=:all:` prints `ERROR: Could not find a version that satisfies the requirement psycopg2==2.9.9`. `orjson` downloads `orjson-3.10.7-cp312-cp312-musllinux_1_2_x86_64.whl`. The `pip wheel` retry fails with `pg_config executable not found`; after `apk add build-base postgresql-dev` it builds. `required_builder_packages=["build-base","postgresql-dev"]`; runtime needs `libpq`.

Phase 3: musl `Version 1.2.5`. Verdict `pass` with builder packages; risks: thread stack size (native dep present).

---

## Exit Criteria

DONE when `libc_verdict.status` is set from command evidence and, for musl, every dependency is either confirmed to install or listed as blocking.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Image reports musl but plan says glibc | **Return**: correct `base_image_plan.libc` and rerun from Phase 1. |
| Phase 2 | `pip download` cannot reach the index | **Retry**: rerun with network access or the project's index URL (`--index-url`); never mark a package as passing without a download. |
| Phase 2 | Native module fails to compile on musl | **Return**: `status=fail`; recommend the glibc row. |
| Phase 3 | User wants Alpine despite `fail` | **Stop**: report the blocking evidence; do not ship with shims untested. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
