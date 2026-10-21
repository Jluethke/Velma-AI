# Release Version Lock

**One-line description:** Turns the measured change class into one exact release version and git tag, using SemVer 2.0.0, the 0.x caret conventions of Cargo and npm, PEP 440 pre-release spelling for Python, and Go's `v`-prefixed tag rules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): `python`, `node`, `go` or `rust`.
- `previous_version` (string, optional): Last published version, for example `0.4.1`. Absent means first release.
- `prerelease_label` (string, optional): `alpha`, `beta` or `rc` when this is a pre-release; absent for a final release.
- `py_change_class` (string, required): From `pkg-py-griffe-api-diff`; empty when the stack is not python.
- `node_change_class` (string, required): From `pkg-node-api-extractor-diff`; empty when the stack is not node.
- `go_change_class` (string, required): From `pkg-go-gorelease-diff`; empty when the stack is not go.
- `rust_change_class` (string, required): From `pkg-rust-semver-checks`; empty when the stack is not rust.

---

## Outputs

- `release_version` (string): The exact version string to write into the manifest, in the registry's own spelling.
- `release_tag` (string): The git tag to create, for example `v1.0.0`, or `sub/v1.0.0` for a Go module in a subdirectory.

---

## Phase 1: Select the Change Class

### Entry Criteria
- Exactly one of the four change class inputs is non-empty, and it belongs to `stack`.

### Actions
1. Pick the class input for `stack`: python to `py_change_class`, node to `node_change_class`, go to `go_change_class`, rust to `rust_change_class`.
2. If that input is empty, or a different stack's input is non-empty, stop: the wrong branch of the chain ran.
3. If the class is `none`, stop: there is nothing to release.

### Output
One change class.

### Quality Gate
- The selected class is one of `initial`, `major`, `minor`, `patch`.

---

## Phase 2: Compute the Core Version

### Entry Criteria
- Class selected.

### Actions
1. Parse `previous_version` as `MAJOR.MINOR.PATCH` (strip a leading `v`). If it carries a pre-release suffix (`1.2.0rc1`, `1.2.0-rc.1`), see step 4.
2. Apply this table:

   | Class | previous MAJOR is 0 | previous MAJOR is 1 or more |
   |---|---|---|
   | initial | `0.1.0` unless the user states the API is stable, then `1.0.0` | n/a |
   | major | bump MINOR, reset PATCH (`0.4.1` to `0.5.0`) | bump MAJOR, reset others (`1.4.2` to `2.0.0`) |
   | minor | bump PATCH (`0.4.1` to `0.4.2`) | bump MINOR, reset PATCH (`1.4.2` to `1.5.0`) |
   | patch | bump PATCH | bump PATCH |

   The 0.x column follows the Cargo and npm caret rules: `^0.4.1` means `>=0.4.1, <0.5.0`, so a breaking change must move MINOR or users on `^0.4` receive it automatically. SemVer 2.0.0 itself allows anything in 0.y.z; the caret convention is why this table is stricter.
3. Going from 0.x to 1.0.0 is the owner's decision, never this flow's. Only do it when the owner says so.
4. If `previous_version` is a pre-release of the target (previous `2.0.0-rc.1`, class unchanged), the next final is `2.0.0` and the next pre-release is `2.0.0-rc.2`; do not bump the core again.

### Output
Core version `MAJOR.MINOR.PATCH`.

### Quality Gate
- The table cell used is recorded.
- The core version compares greater than `previous_version`: python `python -c "from packaging.version import Version as V; print(V('<new>') > V('<old>'))"` prints `True`; other stacks `npx semver -r "><old>" <new>` (for example `npx semver -r ">0.3.0" 0.4.0`) prints the new version; empty output means it is not greater.

---

## Phase 3: Spell the Version and Tag for the Registry

### Entry Criteria
- Core version computed.

### Actions
1. Add the pre-release label if given. Number it 1 unless an earlier pre-release of the same core exists:

   | Stack | Final | Pre-release spelling | Rule source |
   |---|---|---|---|
   | python | `1.5.0` | `1.5.0a1`, `1.5.0b1`, `1.5.0rc1` | PEP 440 (pip normalizes `1.5.0-rc.1` to `1.5.0rc1`; write the normal form) |
   | node | `1.5.0` | `1.5.0-alpha.1`, `1.5.0-beta.1`, `1.5.0-rc.1` | SemVer 2.0.0 |
   | rust | `1.5.0` | `1.5.0-rc.1` | SemVer 2.0.0 (Cargo) |
   | go | `v1.5.0` | `v1.5.0-rc.1` | Go module versions require the `v` prefix |

2. Tag: `v<version>` for python, node and rust (project convention; keep whatever prefix earlier tags use, check with `git tag --list | tail`). For go the tag is the version itself; for a module in subdirectory `sub/`, the tag is `sub/v1.5.0`.
3. Confirm the tag does not exist: `git rev-parse -q --verify refs/tags/<tag>` prints nothing.
4. Confirm the version is not already on the registry: python `curl -s -o /dev/null -w "%{http_code}" https://pypi.org/pypi/<name>/<version>/json` prints `404`; node `npm view <name>@<version> version` prints nothing; rust `cargo info <name>@<version>` fails (Cargo 1.82 or later) or check `https://crates.io/api/v1/crates/<name>/<version>` returns 404. All three registries refuse to reuse a version number, even after deletion or yank.

### Output
`release_version`, `release_tag`.

### Quality Gate
- Tag absence and registry absence checks are pasted with their output.
- Python versions satisfy `python -c "from packaging.version import Version; print(Version('<v>'))"` printing the same string (it is already normalized).

---

## Worked Example

Illustrative. `stack = rust`, `previous_version = 0.3.0`, `rust_change_class = major`, no pre-release.

Phase 1: selected `major`.
Phase 2: previous MAJOR is 0, class major: bump MINOR: `0.4.0`. `npx semver -r ">0.3.0" 0.4.0` prints `0.4.0`.
Phase 3: `release_version = 0.4.0`, `release_tag = v0.4.0`. `git rev-parse -q --verify refs/tags/v0.4.0` prints nothing; crates.io API returns 404.

---

## Exit Criteria

DONE when one version string and one tag exist, both checked as unused locally and on the registry.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No class or two classes provided | **Stop**: the stack conditions in the chain are wrong; report which inputs were set. |
| Phase 1 | Class is `none` | **Stop**: nothing to release. |
| Phase 2 | User wants 1.0.0 without stating it | **Return**: ask the owner; never promote to 1.0.0 on your own. |
| Phase 3 | Version already on the registry | **Adjust**: bump PATCH (or the pre-release number) and rerun Phase 3; never try to overwrite. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
