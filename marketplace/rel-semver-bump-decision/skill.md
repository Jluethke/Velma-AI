# SemVer Bump Decision from Commits and API Diff

**One-line description:** Combines classified Conventional Commits, stack API diff results and deprecation notices into one next version using SemVer 2.0.0 rules, applies the 0.x and pre-release rules, writes the version in the syntax each ecosystem requires (SemVer, PEP 440, Go tag), and checks it with the ecosystem's own version parser.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `commit_list` (object[], required): From rel-commit-history-audit.
- `noncompliant_commits` (object[], required): From rel-commit-history-audit, each with a proposed type.
- `current_version` (string, required): The last released version (for example `1.8.0`), without a `v` prefix.
- `prerelease_id` (string, optional): `alpha`, `beta` or `rc` when cutting a pre-release; empty for a stable release.
- `py_api_breaks` (object[], optional): From rel-py-api-break-griffe.
- `node_api_breaks` (object[], optional): From rel-node-api-break-extractor.
- `go_api_breaks` (object, optional): From rel-go-api-break-gorelease.
- `rust_api_breaks` (object, optional): From rel-rust-api-break-semver-checks.
- `deprecation_notices` (object[], optional): From rel-deprecation-policy-notice.

---

## Outputs

- `next_version` (object): `semver` (for example `2.0.0-rc.1`), `pep440` (for example `2.0.0rc1`), `tag` (for example `v2.0.0-rc.1`), or `null` when no release is warranted.
- `bump_level` (string): `major`, `minor`, `patch` or `none`.
- `bump_rationale` (object[]): Each signal that raised the level, with its source (commit sha, API diff entry, deprecation) and the table row applied; plus any disagreement between commits and API tools.

---

## Phase 1: Collect Signals

### Entry Criteria
- `commit_list` and `current_version` present. `current_version` parses as SemVer: `npx --yes semver <current_version>` prints it back.

### Actions
1. Merge `noncompliant_commits` into the signal set using their proposed type.
2. Turn each input into signals with this table (first column is the evidence, second the level it implies):

   | Evidence | Level |
   |---|---|
   | Commit with `breaking` = true | major |
   | Any entry in `py_api_breaks` / `node_api_breaks` not marked as a policy question | major |
   | `go_api_breaks.incompatible` non-empty | major |
   | `rust_api_breaks.required_bump` = `major` | major |
   | Commit type `feat` | minor |
   | Any `deprecation_notices` entry (SemVer 2.0.0 item 7) | minor |
   | `rust_api_breaks.required_bump` = `minor`, or `go_api_breaks.compatible` non-empty | minor |
   | Commit type `fix` or `perf`, or a revert of a released change | patch |
   | Only `docs`, `test`, `ci`, `chore`, `style`, `refactor`, `build` | none |

3. Policy questions (raised `requires-python`, `engines.node`, `go` directive, `rust-version`, dependency majors) do not set a level here. List them in `bump_rationale` and ask the user to rule on each before Phase 2. Do not decide them yourself.

### Output
Signal list.

### Quality Gate
- Every commit sha appears in exactly one signal.
- Every API break entry appears in a signal or as a listed policy question.

---

## Phase 2: Decide the Level and Version

### Entry Criteria
- Signals collected; the user has ruled on each policy question.

### Actions
1. `bump_level` = the highest level among signals (`major` > `minor` > `patch` > `none`).
2. Reconcile commits with API tools:
   - API tool reports a break but no commit is marked breaking: keep `major` and record "commit messages understated a break" with the API entry.
   - A commit is marked breaking but no API tool reports one: keep `major` (tools cannot see behavior changes) unless the user confirms in writing that the change is not breaking.
3. Apply the 0.x rule (SemVer 2.0.0 item 4: major version zero is for initial development and anything may change). Use the Cargo and npm caret convention: when the current major is 0, `major` becomes a bump of the middle number and `minor` becomes a bump of the last number. Record that this convention was applied. To leave 0.x, the user must ask for `1.0.0` explicitly.
4. Compute the stable version with node-semver: `npx --yes semver -i <major|minor|patch> <current_version>`.
5. Pre-release (`prerelease_id` set):
   - If `current_version` is already a pre-release of the same target, increment the counter: `npx --yes semver -i prerelease --preid <id> <current_version>` (for example `2.0.0-rc.1` to `2.0.0-rc.2`).
   - Otherwise: `npx --yes semver -i pre<level> --preid <id> <current_version>` then make sure the counter starts at `.1` or `.0` per project convention (node-semver starts at `.0`; check the existing tags with `git tag -l '*-rc.*'` and follow them).
6. If `bump_level` = `none`, set `next_version` = null and stop: no release.

### Output
`bump_level`, `next_version.semver`.

### Quality Gate
- `npx --yes semver <next semver>` prints the version (valid).
- `npx --yes semver <current_version> <next>` prints both versions sorted by SemVer precedence, with `<next>` on the last line (proves the new version is higher).

---

## Phase 3: Ecosystem Spellings

### Entry Criteria
- `next_version.semver` set.

### Actions
1. Tag: `v` + semver (Go requires the `v`; npm, PyPI and crates do not read tags, but keep one convention). For a Go module in a subdirectory, the tag is `<dir>/v<semver>`.
2. PEP 440 for Python: `1.4.0-rc.1` becomes `1.4.0rc1`, `-alpha.2` becomes `a2`, `-beta.1` becomes `b1`. Check: `python -c "from packaging.version import Version; print(Version('2.0.0rc1'))"` prints `2.0.0rc1`. Never put build metadata (`+local`) in a version uploaded to PyPI; PyPI rejects local version labels.
3. Cargo accepts SemVer pre-release syntax (`2.0.0-rc.1`). Check with `cargo metadata` after writing it to `Cargo.toml` in the release commit, not here.
4. Precedence reminder for reviewers (SemVer 2.0.0 item 11): `1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0`.

### Output
`next_version`, `bump_rationale`.

### Quality Gate
- The PEP 440 check command prints the `pep440` value unchanged (python stack).
- `next_version.tag` matches the regular expression `^([a-z0-9._/-]+/)?v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$`.

---

## Worked Example

Illustrative. `current_version` = `1.8.0`, commits: one `feat`, two `fix`, one `fix(parser)!`. `py_api_breaks` has 2 entries plus one policy question (`requires-python` 3.8 to 3.10). `prerelease_id` = `rc`.

- Phase 1: signals: major (bang commit), major x2 (griffe), minor (feat), patch x2. Policy question raised; the user rules "dropping 3.8 and 3.9 is acceptable in a major".
- Phase 2: `bump_level` = major. `npx --yes semver -i premajor --preid rc 1.8.0` prints `2.0.0-rc.0`; existing tags use `.1` starts, so `next_version.semver` = `2.0.0-rc.1`.
- Phase 3: `tag` = `v2.0.0-rc.1`, `pep440` = `2.0.0rc1`; `python -c "from packaging.version import Version; print(Version('2.0.0rc1'))"` prints `2.0.0rc1`.

---

## Exit Criteria

DONE when `bump_level` equals the highest signal, every signal and policy ruling is in `bump_rationale`, and `next_version` passes each ecosystem parser check, or `next_version` is null with `bump_level` = `none`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `current_version` does not parse | **Stop**: get the real last released version from the registry (`npm view`, `pip index versions`, `cargo info`, `go list -m -versions`). |
| Phase 1 | Policy question with no ruling | **Return**: ask the user; do not pick MAJOR or MINOR on their behalf. |
| Phase 2 | Commits and API tools disagree | **Adjust**: take the higher level and record the disagreement. |
| Phase 2 | `npx semver` unavailable (no Node) | **Adjust**: `python -m pip install semver` and use `python -c "import semver; print(semver.Version.parse('1.8.0').bump_minor())"`. |
| Phase 3 | Python package uses setuptools-scm or hatch-vcs | **Adjust**: the version comes from the tag; ensure the tag is `v<semver>` and the PEP 440 form is what the build will produce. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
