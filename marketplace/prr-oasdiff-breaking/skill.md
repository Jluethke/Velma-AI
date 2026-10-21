# OpenAPI Breaking-Change Diff with oasdiff

**One-line description:** Extracts the base version of each changed OpenAPI document with `git show`, runs `oasdiff breaking` between base and head, reads each reported check ID and level, and confirms the spec change matches the handler code so the contract and the implementation do not drift apart.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `openapi_specs` (string[], required): Changed OpenAPI document paths from `prr-api-compat-pass`.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `openapi_breaking_findings` (object[]): Breaking and warning-level contract changes, written to `<findings_dir>/prr-oasdiff-breaking.json`.

---

## Phase 1: Extract Base and Head Documents

### Entry Criteria
- `openapi_specs` is non-empty. `oasdiff --version` succeeds (install from the project's GitHub releases or `go install github.com/oasdiff/oasdiff@latest`).

### Actions
1. For each spec path, write the base version to a scratch directory outside the repository:
   `MB=$(git -C <repo_dir> merge-base origin/<base_branch> HEAD)`
   `git -C <repo_dir> show $MB:<spec path> > ../oas-base/<name>`
   If the file did not exist at the merge base (new spec), there is nothing to break; record "new spec" and skip it.
2. If the spec uses `$ref` to other files, extract every referenced file the same way into the same relative layout, or oasdiff will fail to resolve them.
3. If the spec is generated from code (FastAPI `app.openapi()`, springdoc, swag, NestJS Swagger), regenerate it on both base and head with the project's documented command instead, because a hand-committed spec may be stale.

### Output
Base and head spec files for each path.

### Quality Gate
- Each base file is non-empty (`test -s`) or recorded as "new spec".
- `oasdiff diff ../oas-base/<name> <spec path>` runs without a parse error.

---

## Phase 2: Run the Breaking-Change Check

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run: `oasdiff breaking ../oas-base/<name> <spec path>`.
2. For JSON output add `--format json`; confirm the flag with `oasdiff breaking --help` for the installed version.
3. To fail on errors in scripts, oasdiff provides `--fail-on ERR` (or `WARN`) in current releases; older releases used `--fail-on-diff`. Check `--help` before using either.
4. Each reported change has a level (`error`, `warning`, `info`), a check ID (for example `response-property-removed`, `request-parameter-became-required`, `api-path-removed-without-deprecation`, `response-success-status-removed`, `request-property-type-changed`), the operation (`GET /orders`) and the source location.
5. Also run `oasdiff changelog ../oas-base/<name> <spec path>` to see non-breaking changes; use it to check the CHANGELOG entry.

### Output
Breaking-change report per spec.

### Quality Gate
- The command and its exit code are recorded for every spec.
- Every reported change has a level and a check ID recorded.

---

## Phase 3: Cross-Check Code and Record Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. For every changed operation in the spec, find the handler: `rg -n '<path literal>' <repo_dir>/src` (route strings such as `"/orders/{id}"` or `"/orders/:id"`). Confirm the handler change matches the spec change (field removed in both, new required parameter validated in both). A spec change with no matching code change, or the reverse, is drift.
2. Label:

| Result | Label |
|---|---|
| `error` level change not stated in the PR intent | blocking |
| `error` level change that is intended | blocking unless a new API version path, a deprecation period (`deprecated: true` plus a sunset date, which oasdiff checks), or a consumer sign-off is documented |
| `warning` level change | question |
| Spec and handler disagree | blocking |
| `info` level change | none (verify CHANGELOG) |

3. Write `<findings_dir>/prr-oasdiff-breaking.json` (fields `flow`, `category`="compatibility", `file` = spec path, `line`, `evidence` = oasdiff line with level and check ID, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`openapi_breaking_findings`.

### Quality Gate
- Every `error` level change has a finding.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. `openapi_specs` = [`api/openapi.yaml`].

- Phase 1: `git show 7c1d2e3:api/openapi.yaml > ../oas-base/openapi.yaml`.
- Phase 2: `oasdiff breaking ../oas-base/openapi.yaml api/openapi.yaml` prints:
  ```
  1 changes: 1 error, 0 warning, 0 info
  error	[response-property-removed] at api/openapi.yaml
  	in API GET /orders/{id}
  		removed the required property 'total_cents' from the response with the '200' status
  ```
- Phase 3: handler `orders/views.py` still returns `total_cents`; the spec and code disagree, and the PR intent does not mention removal. Blocking: "restore `total_cents` in the spec, or remove it from the handler behind a new API version".

---

## Exit Criteria

DONE when every changed OpenAPI document was diffed against its merge-base version with oasdiff, every error and warning level change is labeled, and spec-to-handler drift is checked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `$ref` cannot be resolved for the base file | **Retry**: extract all referenced files into the same layout and rerun. |
| Phase 1 | Spec generated at build time and not committed | **Adjust**: generate base and head with the project's command and diff those files. |
| Phase 2 | oasdiff flag rejected | **Adjust**: run `oasdiff breaking --help` and use the listed flag; do not guess. |
| Phase 3 | Handler cannot be found from the path | **Adjust**: search for the `operationId` value instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
