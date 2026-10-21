# Build an aarch64 manylinux Wheel

**One-line description:** Builds an aarch64 Python wheel inside the official `manylinux_2_28_aarch64` container run under qemu emulation, then repairs it with `auditwheel` so the wheel bundles its non-system shared libraries and is tagged with a portable manylinux platform tag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Path to the Python package root that holds `pyproject.toml` or `setup.py`.
- `manylinux_tag` (string, optional): The manylinux image tag, for example `manylinux_2_28` or `manylinux2014`. If absent, default to `manylinux_2_28`.
- `binfmt_state` (object, required): Output of `xarch-qemu-binfmt-register`, so the aarch64 container can run on an x86-64 host.

---

## Outputs

- `manylinux_wheel` (object): The repaired wheel path, its platform tag, and the bundled libraries list.
- `manylinux_report` (object): The build image used, the pre-repair tag, and the auditwheel result.

---

## Phase 1: Build the Wheel in the aarch64 manylinux Image

### Entry Criteria
- `binfmt_state` shows the aarch64 handler is enabled.
- `project_dir` holds a buildable Python package.

### Actions
1. Pull the aarch64 manylinux image, for example `quay.io/pypa/manylinux_2_28_aarch64`. The `_aarch64` suffix is the arch; do not use the x86-64 image under emulation expecting aarch64 wheels.
2. Build inside it with a pinned CPython from `/opt/python`:

```
docker run --rm --platform linux/arm64 -v "$project_dir":/io \
  quay.io/pypa/manylinux_2_28_aarch64 \
  bash -lc '/opt/python/cp311-cp311/bin/pip wheel /io -w /io/wheelhouse --no-deps'
```

`--platform linux/arm64` selects the aarch64 image; it runs under qemu because of the binfmt registration.
3. The raw wheel is tagged `linux_aarch64`, which PyPI rejects. It must be repaired to a manylinux tag in Phase 2. Do not rename the file by hand to a manylinux tag; that lies about the glibc floor and breaks on older systems.
4. Do not add `--no-build-isolation` unless the build deps are already present; isolation keeps the build reproducible.

### Output
The raw `linux_aarch64` wheel in `wheelhouse`.

### Quality Gate
- A `*.whl` file exists in `project_dir/wheelhouse`.
- `python -c "import sys; print(sys.argv[1])" wheel.whl` name contains `linux_aarch64` (pre-repair) or run `unzip -l` to confirm it holds a `.so` for aarch64.

---

## Phase 2: Repair with auditwheel

### Entry Criteria
- A raw wheel exists.

### Actions
1. Run auditwheel inside the same aarch64 image so it reads the aarch64 `.so` files correctly:

```
docker run --rm --platform linux/arm64 -v "$project_dir":/io \
  quay.io/pypa/manylinux_2_28_aarch64 \
  bash -lc 'auditwheel repair /io/wheelhouse/*.whl -w /io/dist'
```

2. `auditwheel repair` copies external shared libraries into the wheel and rewrites the RPATHs, then retags the wheel to the highest manylinux tag the libraries allow, for example `manylinux_2_28_aarch64`.
3. Read the auditwheel output. It prints the platform tag it assigned and the libraries it bundled. Confirm the new tag starts with `manylinux` and ends in `_aarch64`.
4. Verify the repaired wheel tag: `unzip -p dist/*.whl '*.dist-info/WHEEL' | grep Tag` shows a `manylinux_*_aarch64` tag.
5. Do not skip auditwheel; an unrepaired `linux_aarch64` wheel will fail to install on most target systems and is not accepted by PyPI.

### Output
`manylinux_wheel`, `manylinux_report`.

### Quality Gate
- `auditwheel show dist/*.whl` reports a `manylinux_*_aarch64` platform tag.
- The repaired wheel's `WHEEL` metadata `Tag` line contains `manylinux` and `aarch64`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/pkg`, `manylinux_tag` = `manylinux_2_28`.

```
$ docker run --rm --platform linux/arm64 -v ~/src/pkg:/io quay.io/pypa/manylinux_2_28_aarch64 \
    bash -lc '/opt/python/cp311-cp311/bin/pip wheel /io -w /io/wheelhouse --no-deps'
$ ls ~/src/pkg/wheelhouse
pkg-1.0-cp311-cp311-linux_aarch64.whl
$ docker run --rm --platform linux/arm64 -v ~/src/pkg:/io quay.io/pypa/manylinux_2_28_aarch64 \
    bash -lc 'auditwheel repair /io/wheelhouse/*.whl -w /io/dist'
Fixed-up wheel written to /io/dist/pkg-1.0-cp311-cp311-manylinux_2_28_aarch64.whl
```

`manylinux_wheel` = `{ "path": "dist/pkg-...-manylinux_2_28_aarch64.whl", "tag": "manylinux_2_28_aarch64" }`.

---

## Exit Criteria

DONE when a repaired wheel exists with a `manylinux_*_aarch64` platform tag confirmed by `auditwheel show`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Exec format error` in the container | **Return**: the aarch64 binfmt handler is not enabled; run `xarch-qemu-binfmt-register` first. |
| Phase 1 | Build needs a system library | **Adjust**: `yum install` it inside the manylinux image before `pip wheel`. |
| Phase 2 | auditwheel reports `linux_aarch64` only | **Adjust**: a bundled library needs a newer glibc than the tag allows; raise `manylinux_tag` or statically link that dependency. |
| Phase 2 | auditwheel cannot find a library | **Adjust**: set `LD_LIBRARY_PATH` in the container to where the build installed it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
