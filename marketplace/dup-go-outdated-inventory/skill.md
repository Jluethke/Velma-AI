# Go Outdated Inventory

**One-line description:** Produces a normalized list of outdated Go modules from `go list -u -m -json all`, separating direct from indirect requirements and finding new major versions (v2+) that `go list -u` never reports because they live at a different module path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `target_packages`, `work_dir`.
- `lockfile_status` (object, required): From `dup-go-module-hygiene`. Module must be tidy and verified.

---

## Outputs

- `outdated_inventory` (object[]): One record per outdated module: `ecosystem` (`go`), `name` (module path), `current`, `wanted` (newest in the same major), `latest` (newest across majors, by path), `update_type`, `direct` (not `// indirect`), `dev` (false; Go has no dev deps), `new_major_path` (for example `.../v3`, or null), `go_directive_of_latest`. Also written to `<work_dir>/outdated.json`.

---

## Phase 1: Collect Same-Major Updates

### Entry Criteria
- `go mod tidy` check passed.

### Actions
1. Machine-readable list: `go list -u -m -json all > .dep-upgrade/go-list-u.json`. Each object has `Path`, `Version`, `Indirect` (true for indirect), `Main` (true for your own module; skip it), and `Update` (`{"Path":..., "Version":...}`) only when a newer version exists in the same major.
2. Human-readable direct-only view: `go list -u -m -f '{{if and (not .Main) (not .Indirect) .Update}}{{.Path}} {{.Version}} -> {{.Update.Version}}{{end}}' all`.
3. Retracted or deprecated modules: `go list -m -u -retracted -json all` (look for `Retracted`) and the `Deprecated` field in the JSON from step 1. A deprecated module comment often names its replacement.
4. Note: the `GOPROXY` setting decides where versions come from. If `go env GOPROXY` is `off` or the module is private (`GOPRIVATE`), updates may be missing; record that.

### Output
Raw same-major update list.

### Quality Gate
- `go-list-u.json` exists and `go list` exited 0.

---

## Phase 2: Find New Major Versions

### Entry Criteria
- Raw list exists.

### Actions
1. For each direct module path `P` at major `vN` (N is 0 or 1 when the path has no `/vN` suffix), probe the next majors: `go list -m -versions P/v(N+1)` then `/v(N+2)` until the command fails with `module ... not found` or similar. Example: `go list -m -versions github.com/go-chi/chi/v5`.
2. Modules that stayed at `v2+` without a `/vN` path are marked `+incompatible` in `go.mod`; record them as-is and read their changelog by hand.
3. `gopkg.in/x.vN` paths encode the major in the path suffix `.vN`; probe `gopkg.in/x.v(N+1)`.
4. Set `latest` to the newest version of the highest existing major, `new_major_path` to that path.

### Output
Major-version probes per direct module.

### Quality Gate
- Every direct module has a probe result saved (found path or "none").

---

## Phase 3: Normalize And Classify

### Entry Criteria
- Phases 1 and 2 done.

### Actions
1. `update_type`: `major` when `new_major_path` is set; for same-major updates compare `Version` to `Update.Version` with semver (a `v0` minor change counts as major); pseudo-versions (`v0.0.0-20240101000000-abcdef123456`) count as `major` because their API promises nothing.
2. `go_directive_of_latest`: `go mod download -json <path>@<version>` prints `GoMod` (a file path); read its `go` line. If it is above the installed toolchain and `GOTOOLCHAIN=local`, mark `blocked_by_runtime`.
3. Filter to `target_packages` when given.
4. Merge into `<work_dir>/outdated.json` by (`ecosystem`, `name`).

### Output
`outdated_inventory`.

### Quality Gate
- Every record has `update_type` set and every `major` record has `new_major_path` or a pseudo-version note.

---

## Worked Example

Illustrative only. Service on Go 1.22.

- Phase 1: direct-only view prints `github.com/jackc/pgx/v5 v5.5.4 -> v5.7.1` and `golang.org/x/sync v0.6.0 -> v0.8.0`.
- Phase 2: `go list -m -versions github.com/jackc/pgx/v6` fails (no v6); `github.com/go-chi/chi v1.5.5` probe `go list -m -versions github.com/go-chi/chi/v5` lists `v5.0.0 ... v5.1.0`, so chi has `new_major_path=github.com/go-chi/chi/v5`.
- Phase 3: pgx `minor`; x/sync `major` (v0 minor); chi `major`, import paths must change.

---

## Exit Criteria

DONE when `<work_dir>/outdated.json` holds classified Go records including new major paths.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Private module fetch fails (`410 Gone` or auth) | **Adjust**: set `GOPRIVATE` per the user's org pattern only with their approval; otherwise record as unknown. |
| Phase 2 | Probe loops on a module with many majors | **Adjust**: stop at the first missing major. |
| Phase 3 | `go mod download` blocked by proxy policy | **Return**: record `go_directive_of_latest=unknown`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
