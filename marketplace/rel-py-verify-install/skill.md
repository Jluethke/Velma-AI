# Python Post-Publish Install Verification

**One-line description:** Installs the just-published release from PyPI into a fresh virtual environment in an empty directory (so the local source tree cannot shadow it), with the cache off and the version pinned, then proves it imports, reports the right version, runs a smoke command, installs from the sdist too, and matches the built hashes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_name` (string, required): Distribution name on PyPI.
- `next_version` (object, required): Uses `pep440`.
- `pypi_release_url` (object, required): From rel-py-publish-pypi-trusted; holds the published file names and sha256 values.
- `smoke_import` (string, optional): Import name plus one call to run, for example `acme.parse('{}')`. Defaults to importing the top-level module.

---

## Outputs

- `py_install_report` (object): `status` (`PASS` or `FAIL`), pip command and resolved wheel tag, imported version, smoke result, sdist install result, hash comparison, Python versions tested.

---

## Phase 1: Clean Install from the Index

### Entry Criteria
- `pypi_release_url` lists the files.

### Actions
1. Make an empty directory outside any checkout: `D=$(mktemp -d) && cd "$D"`. Running from the repository makes `import` pick up the local source instead of the installed package; this is the most common false PASS.
2. `python -m venv .venv && . .venv/bin/activate` (Windows: `.venv\Scripts\activate`). `python -m pip install --upgrade pip`.
3. Install pinned with no cache: `python -m pip install --no-cache-dir "<package_name>==<pep440>"`. A new release can take a short time to reach every CDN node; if pip says `No matching distribution found`, retry up to the number of attempts the user allows, waiting between attempts. Do not invent a wait time; ask or use the user's CI default.
4. Record which file pip chose: `python -m pip download --no-deps --no-cache-dir -d dl "<package_name>==<pep440>" && ls dl`. A wheel name tells the tag (`py3-none-any`, `cp312-cp312-manylinux_2_17_x86_64...`); an sdist name means no compatible wheel exists for this platform.
5. Hash: `sha256sum dl/*` and compare with the sha256 in `pypi_release_url` for that file.

### Output
Installed environment and hash comparison.

### Quality Gate
- `pwd` is not inside a git repository: `git rev-parse --is-inside-work-tree` fails with "not a git repository".
- The downloaded file sha256 equals the published sha256.

---

## Phase 2: Import, Version and Smoke Test

### Entry Criteria
- Package installed.

### Actions
1. Version and location: `python -c "import importlib.metadata as m, <module>; print(m.version('<package_name>')); print(<module>.__file__)"`. The version must equal `pep440` and the file path must be inside `.venv/`.
2. Smoke: `python -c "import <module>; print(<smoke_import>)"`. Exit code 0 is required.
3. Console scripts: for each name in the package's `[project.scripts]` (read with `python -c "import importlib.metadata as m; print([e.name for e in m.entry_points(group='console_scripts') if e.dist.name.lower()=='<package_name>'.lower()])"`), run `<script> --version` or `<script> --help` and require exit 0.
4. Dependency health: `python -m pip check` must print `No broken requirements found.`

### Output
Import and smoke results.

### Quality Gate
- Printed version equals `pep440` and `__file__` is under `.venv`.
- `pip check` prints `No broken requirements found.`

---

## Phase 3: sdist and Python Matrix

### Entry Criteria
- Phase 2 passed.

### Actions
1. sdist build test in a second fresh venv: `python -m pip install --no-cache-dir --no-binary "<package_name>" "<package_name>==<pep440>"`. This proves the sdist builds for downstream packagers. Run the Phase 2 smoke again.
2. Python versions: read `Requires-Python` from `python -m pip show <package_name>` or the classifiers on PyPI. Repeat Phase 1 and Phase 2 on the lowest and highest declared versions (for example with `uv venv -p 3.10` and `uv venv -p 3.13`, or `actions/setup-python` matrix). Use only versions the package declares.
3. Set `status` = `PASS` only if every check in all phases passed. Any failure sets `FAIL` with the failing command and output; downstream rel-yank-bad-release reads this.

### Output
`py_install_report`.

### Quality Gate
- The sdist install exit code is recorded.
- `status` is `PASS` only when every recorded command exited 0.

---

## Worked Example

Illustrative. `package_name` = `acme-parser`, module `acme`, `pep440` = `1.9.0`, `smoke_import` = `acme.parse('{}')`.

- Phase 1: in `/tmp/tmp.k2Jd`, `pip install --no-cache-dir "acme-parser==1.9.0"` succeeds; `ls dl` shows `acme_parser-1.9.0-py3-none-any.whl`; sha256 `9b1e...c4` equals PyPI.
- Phase 2: prints `1.9.0` and `/tmp/tmp.k2Jd/.venv/lib/python3.12/site-packages/acme/__init__.py`; smoke prints `{}`; `acme --version` prints `acme 1.9.0`.
- Phase 3: `--no-binary acme-parser` install builds and passes the smoke; Python 3.10 and 3.13 pass. `status` = `PASS`.

---

## Exit Criteria

DONE when the published version installed from PyPI in a clean environment outside the repo, imported from site-packages with the right version, passed the smoke test, built from sdist, matched the published hashes, and `status` reflects every result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `No matching distribution found` right after publish | **Retry**: index propagation; retry within the user's attempt limit, then **Return** FAIL. |
| Phase 1 | Hash differs from published value | **Stop**: report FAIL; something between the index and you altered the file, or the wrong version resolved. |
| Phase 2 | `ModuleNotFoundError` for a dependency | **Return**: FAIL; a runtime dependency is missing from `[project] dependencies`. |
| Phase 2 | `__file__` points into the repository | **Retry**: you ran from the checkout; move to an empty temp directory. |
| Phase 3 | sdist build fails (missing file in sdist) | **Return**: FAIL; the next release must include the file in the sdist. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
