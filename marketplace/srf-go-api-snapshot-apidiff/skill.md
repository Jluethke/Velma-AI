# Go Exported API Snapshot with apidiff

**One-line description:** Writes the exported API of each Go package at the baseline commit to an export data file with `golang.org/x/exp/cmd/apidiff -w`, then reruns `apidiff -incompatible` after each refactoring step so removed identifiers, changed signatures and changed struct fields are reported before commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root containing `go.mod`.
- `go_packages` (string[], required): Full import paths of the packages whose exported API must not change, for example `["example.com/app/render"]`. Internal packages (`.../internal/...`) can be listed if other packages in the module depend on them.
- `baseline_commit` (string, required): SHA from `srf-baseline-green-check`.

---

## Outputs

- `api_snapshot` (string): Directory holding one `.api` export file per package, for example `.refactor/api/`.
- `api_check_command` (string): Shell command that runs `apidiff -incompatible` for every package and fails if any prints output.

---

## Phase 1: Install and Confirm Flags

### Entry Criteria
- `git rev-parse HEAD` equals `baseline_commit`.
- `go build ./...` exits 0.

### Actions
1. Install: `go install golang.org/x/exp/cmd/apidiff@latest`. Confirm `apidiff -h` runs. `golang.org/x/exp` is experimental; record the resolved version from `go version -m $(go env GOPATH)/bin/apidiff`.
2. Read `apidiff -h` and confirm the flags this flow uses: `-w <file>` (write export data), `-incompatible` (print only incompatible changes), `-m` (compare whole modules). If the help text differs, follow the help text.
3. Decide scope:

| Situation | Mode |
|---|---|
| A library others import | Package mode for each package in `go_packages` |
| Whole module is the public contract | Module mode with `-m`, using the module path from `go.mod` |
| Only `main` packages (a binary) | apidiff adds little; record that the API check is skipped and rely on tests |

### Output
Installed tool and chosen mode.

### Quality Gate
- `apidiff -h` exits and lists `-w` and `-incompatible`.
- Mode choice is recorded with the reason from the table.

---

## Phase 2: Write the Baseline Export Data

### Entry Criteria
- Phase 1 complete.

### Actions
1. `mkdir -p .refactor/api` and add `.refactor/` to `.git/info/exclude`.
2. For each package: `apidiff -w .refactor/api/render.api example.com/app/render`. Name each file after the last path element; if two packages share it, use the path with `/` replaced by `_`.
3. Build `api_check_command` as one line that fails when any comparison prints something:
   `out=$(apidiff -incompatible .refactor/api/render.api example.com/app/render); test -z "$out" || { echo "$out"; exit 1; }`
   Repeat the block per package joined with `&&`.
4. Run `api_check_command` on the unchanged tree. It must exit 0 with no output.
5. Mutation: change one exported function's parameter type (for example `int` to `int64`), run `api_check_command`, confirm it prints an incompatible change naming that function, then `git checkout -- <file>`.

### Output
`api_snapshot`, `api_check_command`.

### Quality Gate
- One `.api` file exists per package in `go_packages`.
- `api_check_command` exits 0 on the unchanged tree.
- The mutation produced output and a non-zero exit; after restore, `git status --porcelain` is empty.

---

## Phase 3: Decision Rules for Later Steps

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. After every refactoring step, run `api_check_command` before `git commit`.
2. Apply this table:

| apidiff output line | Action |
|---|---|
| None | Commit. |
| `<Name>: removed` | A rename or move dropped an exported name. Add a forwarding declaration in the old package (`func Old(x T) R { return New(x) }`, `type Old = New`) marked `// Deprecated:` or revert. |
| `<Name>: changed from func(int) to func(int64)` | Signature changed. Revert unless the user approved a breaking change. |
| Struct field removed or type changed | Revert; struct literals in callers break. |
| Lines only under compatible changes (shown when `-incompatible` is omitted) | Additions are allowed; commit. |

3. Never regenerate the `.api` files during the refactor to make the check pass.

### Output
Decision rules recorded in the refactor log.

### Quality Gate
- The table is copied into the refactor log.

---

## Worked Example

Illustrative only.
```
$ apidiff -w .refactor/api/render.api example.com/app/render
$ out=$(apidiff -incompatible .refactor/api/render.api example.com/app/render); test -z "$out" || { echo "$out"; exit 1; }
$ echo $?
0
```
Mutation `func RenderReport(w io.Writer, r Report, width int64) error`:
```
Incompatible changes:
- RenderReport: changed from func(io.Writer, Report, int) error to func(io.Writer, Report, int64) error
```
Restored with `git checkout -- render/render.go`.

---

## Exit Criteria

DONE when every listed package has a baseline export file, the check passes unchanged, and a deliberate signature change is caught.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go install` fails behind a proxy | **Return**: report the error and the `GOPROXY` value; do not vendor the tool into the repo. |
| Phase 2 | apidiff cannot load the package | **Adjust**: run from the module root and use the full import path, not `./render`. |
| Phase 2 | Check prints changes on an unchanged tree | **Stop**: HEAD is not the baseline; recheck `git rev-parse HEAD`. |
| Phase 3 | User wants the break | **Return**: record explicit approval; plan a major version path (`/v2`) per Go module rules. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
