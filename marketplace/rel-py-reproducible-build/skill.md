# Python Reproducible sdist and Wheel Build

**One-line description:** Builds the sdist and wheel twice from clean checkouts of the release tag with `SOURCE_DATE_EPOCH` set to the tag's commit time, a pinned build backend and a fixed umask, compares SHA-256 hashes, and uses `diffoscope` to name the exact cause when they differ.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `release_tag` (object, required): From rel-tag-sign-git; uses the tag name and commit SHA.

---

## Outputs

- `py_dist` (object): Paths and SHA-256 of the wheel and sdist from build A, the version in their metadata, and the build backend with its version.
- `py_repro_report` (object): Hashes of builds A and B, `identical` (bool per file), the environment used (Python version, `SOURCE_DATE_EPOCH`, umask), and diffoscope findings when not identical.

---

## Phase 1: Pin the Environment

### Entry Criteria
- `release_tag` exists locally (`git rev-parse <tag>^{commit}` succeeds).

### Actions
1. Read `[build-system]` in `pyproject.toml` at the tag: `git show <tag>:pyproject.toml | sed -n '/\[build-system\]/,/^\[/p'`. If `requires` has unpinned backends (for example `"hatchling"`), the build is reproducible only with a fixed backend version. Record the version used: `python -m pip download --no-deps --dest /tmp/be hatchling` and read the file name, or pass a constraints file with `PIP_CONSTRAINT=constraints.txt` containing `hatchling==<version>`. Do not edit the tagged `pyproject.toml`.
2. Set the clock: `export SOURCE_DATE_EPOCH=$(git log -1 --format=%ct <tag>)`. Wheel builders (hatchling, flit_core, setuptools through `wheel`/bdist_wheel) use it for zip entry timestamps.
3. Set `umask 022` so file modes in archives do not depend on the shell.
4. Use one Python version for both builds: record `python --version`.

### Output
Environment record.

### Quality Gate
- `echo $SOURCE_DATE_EPOCH` prints a 10-digit integer equal to `git log -1 --format=%ct <tag>`.
- The backend name and exact version are recorded.

---

## Phase 2: Build Twice

### Entry Criteria
- Environment pinned.

### Actions
1. Make two clean checkouts so local leftovers (egg-info, `build/`, untracked files) cannot leak in: `git worktree add /tmp/build-a <tag>` and `git worktree add /tmp/build-b <tag>`.
2. In each: `python -m pip install --upgrade build` once, then `python -m build --sdist --wheel --outdir /tmp/dist-a /tmp/build-a` and the same for b. Use the same environment variables in both shells.
3. Hash: `sha256sum /tmp/dist-a/* /tmp/dist-b/*`.
4. Check the version embedded in the wheel matches the tag: `unzip -p /tmp/dist-a/*.whl '*.dist-info/METADATA' | grep '^Version:'`. With setuptools-scm or hatch-vcs, a dirty or untagged tree gives versions like `1.9.1.dev0+g4e1f0c2`; PyPI rejects local versions (`+...`). The worktree from the tag avoids this.
5. Lint the artifacts: `python -m pip install twine check-wheel-contents` then `twine check --strict /tmp/dist-a/*` and `check-wheel-contents /tmp/dist-a/*.whl`.

### Output
Two sets of artifacts with hashes.

### Quality Gate
- `twine check --strict` prints `PASSED` for every file.
- The `Version:` line equals the tag name without the leading `v`, in PEP 440 form (`v2.0.0-rc.1` becomes `2.0.0rc1`).

---

## Phase 3: Compare and Explain

### Entry Criteria
- Both builds exist.

### Actions
1. If the wheel hashes are equal, mark the wheel `identical` = true. Do the same for the sdist.
2. If a file differs, run `diffoscope /tmp/dist-a/<file> /tmp/dist-b/<file>` (install with `pip install diffoscope`; full output needs system tools, Debian/Ubuntu `apt install diffoscope`). Map what it shows to a cause:

   | diffoscope shows | Cause | Fix (in a later release commit, not this tag) |
   |---|---|---|
   | zip or tar member timestamps differ | backend ignores `SOURCE_DATE_EPOCH` | upgrade or change backend |
   | file permission bits differ | umask differs between shells | `umask 022` in both |
   | gzip header mtime differs in the sdist | sdist compressor writes current time | newer setuptools or another backend; record as known |
   | a generated file contains a date or absolute path | build hook writes time or `__file__` path | make the hook honor `SOURCE_DATE_EPOCH` |
   | member order differs | filesystem order leaks into the archive | backend that sorts entries |

3. Do NOT "fix" by post-processing the archives (for example re-zipping); the artifact you publish must be the one the backend made.
4. Copy build A into the release artifacts directory and fill `py_dist`.

### Output
`py_dist`, `py_repro_report`.

### Quality Gate
- `py_repro_report` holds four hashes (wheel A, wheel B, sdist A, sdist B) and an `identical` value per file.
- Every non-identical file has a diffoscope-backed cause row.

---

## Worked Example

Illustrative. Tag `v1.9.0`, hatchling backend, Python 3.12.

- Phase 1: `SOURCE_DATE_EPOCH=1792483200`, `umask 022`, hatchling pinned through `PIP_CONSTRAINT`.
- Phase 2: `sha256sum` prints:
  ```
  9b1e...c4  /tmp/dist-a/acme-1.9.0-py3-none-any.whl
  9b1e...c4  /tmp/dist-b/acme-1.9.0-py3-none-any.whl
  51aa...07  /tmp/dist-a/acme-1.9.0.tar.gz
  51aa...07  /tmp/dist-b/acme-1.9.0.tar.gz
  ```
  `Version: 1.9.0`. `twine check --strict` prints `PASSED` twice.
- Phase 3: both identical; `py_dist` points at `/tmp/dist-a`.

---

## Exit Criteria

DONE when both artifacts were built twice from clean tag checkouts with recorded inputs, hashes are compared, any difference has a diffoscope-named cause, and `py_dist` points at build A with a metadata version equal to the release version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Backend version cannot be pinned | **Adjust**: record the version that `python -m build` installed (shown in its log) and mark reproducibility as "conditional on backend version". |
| Phase 2 | Version shows `.dev` or `+g<sha>` | **Stop**: the build is not from the tag; check `git describe --tags` in the worktree. |
| Phase 2 | `twine check` fails on the long description | **Return**: fix the README markup in a new release; do not publish a failing artifact. |
| Phase 3 | Hashes differ and cause is in the backend | **Return**: publish build A, record the cause and fix in the next release. |
| Any | Tempted to compare only file names | **Stop**: compare SHA-256 hashes; equal names prove nothing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
