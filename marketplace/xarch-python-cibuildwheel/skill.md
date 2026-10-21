# Build aarch64 Wheels with cibuildwheel

**One-line description:** Configures cibuildwheel to build and test aarch64 Linux wheels on an x86-64 host by setting `CIBW_ARCHS_LINUX=aarch64`, relying on the registered QEMU binfmt handler, selecting the CPython builds, and confirming every produced wheel carries a manylinux aarch64 tag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Path to the package root that holds `pyproject.toml`.
- `cibw_build` (string, optional): The `CIBW_BUILD` selector, for example `cp310-* cp311-* cp312-*`. If absent, cibuildwheel builds all supported CPythons.
- `binfmt_state` (object, required): Output of `xarch-qemu-binfmt-register`, so the aarch64 build containers run under emulation.

---

## Outputs

- `cibw_wheels` (object): The output dir, the list of produced wheels, and each wheel's platform tag.
- `cibw_report` (object): The archs and builds selected, whether tests ran, and the result.

---

## Phase 1: Configure cibuildwheel for aarch64

### Entry Criteria
- `binfmt_state` shows the aarch64 handler is enabled.
- `pipx` or `pip` can install `cibuildwheel`.

### Actions
1. Install: `pipx install cibuildwheel` or `pip install cibuildwheel`.
2. Set the arch. cibuildwheel builds the host arch by default; to build aarch64 on an x86-64 host, set `CIBW_ARCHS_LINUX=aarch64` (or add `[tool.cibuildwheel] archs = ["aarch64"]` in `pyproject.toml`). It uses the registered QEMU handler to run the aarch64 manylinux containers.
3. If `cibw_build` is set, export `CIBW_BUILD="$cibw_build"` to restrict which CPython versions are built. Each one is a separate container run under emulation, so building all versions is slow; select only what you ship.
4. Decide the manylinux image via `CIBW_MANYLINUX_AARCH64_IMAGE` if a specific base is needed (defaults to the pinned manylinux image). Do not point it at an x86-64 image.
5. Do not set `CIBW_ARCHS_LINUX=auto` and expect aarch64; `auto` means the native arch only.

### Output
The configured environment or `pyproject.toml` section.

### Quality Gate
- `CIBW_ARCHS_LINUX` is `aarch64` (or the `pyproject.toml` `archs` lists `aarch64`).
- `cibuildwheel --print-build-identifiers` lists only aarch64 build identifiers.

---

## Phase 2: Build, Test, and Confirm Tags

### Entry Criteria
- The configuration targets aarch64.

### Actions
1. Run: `CIBW_ARCHS_LINUX=aarch64 cibuildwheel --platform linux --output-dir wheelhouse "$project_dir"`.
2. cibuildwheel runs auditwheel repair automatically and, if `CIBW_TEST_COMMAND` is set, runs the test suite inside the aarch64 container under emulation. Emulated tests are slow but catch arch-specific failures; set `CIBW_TEST_COMMAND="pytest {project}/tests"` to enable them.
3. List the output: every file in `wheelhouse` must be a `*manylinux*_aarch64.whl`. Check with `ls wheelhouse` and read one tag: `unzip -p wheelhouse/<one>.whl '*.dist-info/WHEEL' | grep Tag`.
4. If a build hangs, it is usually the emulated test step; reduce `cibw_build` to one version to isolate it, then re-enable.
5. Do not disable tests permanently to make the run finish; emulated tests are the main value of building aarch64 wheels in CI. If they are too slow, reduce the matrix, do not delete the test command.

### Output
`cibw_wheels`, `cibw_report`.

### Quality Gate
- `wheelhouse` holds at least one wheel and every wheel name contains `manylinux` and `aarch64`.
- If `CIBW_TEST_COMMAND` was set, the log shows the tests ran and passed inside the aarch64 container.

---

## Worked Example

Illustrative. `project_dir` = `.`, `cibw_build` = `cp311-* cp312-*`.

```
$ export CIBW_ARCHS_LINUX=aarch64 CIBW_BUILD="cp311-* cp312-*" CIBW_TEST_COMMAND="pytest {project}/tests"
$ cibuildwheel --platform linux --output-dir wheelhouse .
Building cp311-manylinux_aarch64 wheel
Testing cp311-manylinux_aarch64 (running under qemu)
...
$ ls wheelhouse
pkg-1.0-cp311-cp311-manylinux_2_28_aarch64.whl
pkg-1.0-cp312-cp312-manylinux_2_28_aarch64.whl
```

`cibw_wheels` = `{ "dir": "wheelhouse", "wheels": [{"tag": "manylinux_2_28_aarch64"}, ...], "tested": true }`.

---

## Exit Criteria

DONE when every wheel in the output dir carries a `manylinux*_aarch64` tag and, where a test command was set, the emulated tests passed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--print-build-identifiers` lists x86_64 | **Adjust**: `CIBW_ARCHS_LINUX` was not set to `aarch64`; set it. |
| Phase 1 | cibuildwheel not found | **Adjust**: install via `pipx install cibuildwheel`. |
| Phase 2 | Container fails with `Exec format error` | **Return**: run `xarch-qemu-binfmt-register`; the binfmt handler is not active. |
| Phase 2 | Emulated tests time out | **Adjust**: narrow `cibw_build` to one CPython and re-run; do not delete the test command. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
