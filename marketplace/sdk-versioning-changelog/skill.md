# SDK Versioning and Changelog

**One-line description:** Decides the SDK's next Semantic Versioning number from two independent diffs (the API spec diff from oasdiff and the SDK public-surface diff from griffe, api-extractor or gorelease), applies Go major-version module path rules, and writes a Keep a Changelog entry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): The new spec.
- `base_spec_path` (string, optional): The spec the last SDK release was built from. Absent for a first release.
- `current_sdk_version` (string, required): Last released SDK version, or `none` for a first release.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root with the last release tagged in git.

---

## Outputs

- `version_bump` (object): Next version, bump level, the diff findings that decided it, and the files where the version string was updated.
- `changelog_entry` (string): The new `CHANGELOG.md` section in Keep a Changelog format.

---

## Phase 1: Diff the API Spec

### Entry Criteria
- `base_spec_path` is given, or this is a first release (skip to Phase 2 Action 4).

### Actions
1. Install oasdiff (`go install github.com/oasdiff/oasdiff@<version>`, Homebrew, or the Docker image `tufin/oasdiff`).
2. Breaking changes: `oasdiff breaking <base_spec_path> <validated_spec> --fail-on ERR`. Exit code non-zero means at least one `ERR`-level breaking change. Check `oasdiff breaking --help` for the exact flag in your version.
3. Full changelog for the entry: `oasdiff changelog <base_spec_path> <validated_spec> --format markdown > build/api-changes.md`.
4. Record each finding with its level (`ERR`, `WARN`, `INFO`), operation and message.

### Output
API diff findings.

### Quality Gate
- The `oasdiff breaking` exit code and finding count are recorded.

---

## Phase 2: Diff the SDK Public Surface

### Entry Criteria
- Last release tag exists (`git tag --list` shows it), unless first release.

### Actions
1. Run the surface diff for the stack:

| Stack | Tool | Command |
|---|---|---|
| python | griffe | `pip install griffe` then `griffe check acme_client --against <last tag>` (exit non-zero on breaking API changes; see `griffe check --help`) |
| typescript | API Extractor | `npx api-extractor run --local` with `apiReport.enabled: true` in `api-extractor.json`; compare the generated `.api.md` report with the committed one via `git diff --exit-code etc/*.api.md` |
| go | gorelease | `go run golang.org/x/exp/cmd/gorelease@latest -base=<last tag>`; it prints incompatible changes and a suggested version |

2. Record each SDK-surface breaking change (removed method, changed parameter type, renamed model field, narrowed return type).
3. Note: API changes and SDK changes are different. An API `ERR` change usually forces an SDK break; but an SDK-only refactor can break callers with no API change, and an additive API change can be non-breaking for the SDK.
4. First release: no diff; version is the user's choice, commonly `0.1.0` or `1.0.0` (SemVer 2.0.0 item 4: `0.y.z` means the public API is not yet stable).

### Output
SDK surface diff findings.

### Quality Gate
- The surface tool's exit code and output are recorded (or "first release").

---

## Phase 3: Decide, Apply, Write the Changelog

### Entry Criteria
- Both diffs recorded.

### Actions
1. Bump with this table (SemVer 2.0.0), first matching row:

| Finding | Version 1.0.0 or later | Version 0.y.z |
|---|---|---|
| Any SDK-surface breaking change | MAJOR | MINOR (item 4 allows breaks in 0.y.z; state it in the changelog) |
| New operations, models, fields or options, no breaks | MINOR | MINOR or PATCH per project convention; record the choice |
| Bug fixes only | PATCH | PATCH |

2. Go only: a new major version v2 or later requires the module path to end in `/v2` (`module github.com/example/acme-go/v2` in `go.mod`) and import paths to change; the tag is `v2.0.0`. Do NOT tag `v2.0.0` without the path change; the Go toolchain marks it `+incompatible`.
3. Update the version string in exactly the files that hold it: python `pyproject.toml` `[project] version` (and `__version__` if defined separately), typescript `package.json` `version` (`npm version <level> --no-git-tag-version`), go only the git tag. Update the `User-Agent` source if it is not derived from these.
4. Write the `CHANGELOG.md` section (Keep a Changelog 1.1.0): heading `## [<version>] - <YYYY-MM-DD>`, then only non-empty subsections from `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Every breaking change goes first under `Changed` or `Removed`, prefixed `**Breaking:**`, with a migration line (old call, new call).
5. Do NOT paste the full oasdiff output; translate each API change into what the SDK user sees.

### Output
`version_bump`, `changelog_entry`.

### Quality Gate
- `grep -n "## \[<version>\]" CHANGELOG.md` finds the new heading.
- Every SDK-surface breaking change from Phase 2 appears in the entry with a migration line.
- The version string matches in every file that holds it (`grep -rn "<version>" pyproject.toml package.json` as applicable).

---

## Worked Example

Illustrative only. `stack = go`, `current_sdk_version = v1.4.2`.

```
$ oasdiff breaking api/openapi.v1.4.2.yaml api/openapi.yaml --fail-on ERR
1 changes: 1 error, 0 warning, 0 info
error	[response-property-removed] at api/openapi.yaml
	in API GET /v1/users/{id}
		removed the optional property 'legacy_id' from the response with the '200' status
$ go run golang.org/x/exp/cmd/gorelease@latest -base=v1.4.2
# github.com/example/acme-go/acme
## incompatible changes
User.LegacyId: removed
Suggested version: v2.0.0
```
Decision: MAJOR, module path changes to `github.com/example/acme-go/v2`, tag `v2.0.0`. Changelog:
```
## [2.0.0] - 2026-10-20
### Removed
- **Breaking:** `User.LegacyId` removed because the API no longer returns `legacy_id`. Migration: use `User.Id`.
```

---

## Exit Criteria

DONE when the next version follows the SemVer table from recorded API and SDK diffs, the version string is updated everywhere it lives (and the Go module path for v2 or later), and the changelog entry lists every breaking change with a migration line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Base spec unavailable | **Adjust**: check out the spec from the last release tag (`git show <tag>:api/openapi.yaml > build/base.yaml`). |
| Phase 2 | Surface tool not usable (no tag) | **Return**: tag the last release commit with the user's confirmation, then rerun. |
| Phase 3 | Diffs disagree (API break, no SDK break) | **Adjust**: the SDK surface decides the version; document the API change under `Changed`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
