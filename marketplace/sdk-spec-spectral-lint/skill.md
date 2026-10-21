# SDK Spec Spectral Lint

**One-line description:** Validates and lints an OpenAPI 3.0 or 3.1 document with the Spectral CLI, reads the JSON report by severity, and fixes or records every error before any SDK code is generated from the spec.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_path` (string, required): Path to the OpenAPI document (`openapi.yaml` or `openapi.json`). Multi-file specs are allowed; the root file is given here.
- `spectral_ruleset` (string, optional): Path to an existing Spectral ruleset (`.spectral.yaml`, `.spectral.json` or `.spectral.js`). When absent, a ruleset extending `spectral:oas` is created.

---

## Outputs

- `lint_report` (object): Spectral version, ruleset used, counts per severity (error, warn, info, hint), and every error with rule code, JSON path, file and line.
- `validated_spec` (string): Path to the spec that lints with zero errors. Same file as `spec_path` when no fix was needed.

---

## Phase 1: Install and Pin Spectral

### Entry Criteria
- `spec_path` exists and is readable.
- Node.js is installed (`node --version` prints a version).

### Actions
1. Read the first lines of `spec_path` and record the value of the `openapi` key (for example `3.0.3` or `3.1.0`). If the key is `swagger: "2.0"`, go to Error Handling: the spec is Swagger 2.0.
2. Install the CLI as a dev dependency so the version is pinned in `package.json`: `npm install --save-dev @stoplight/spectral-cli`. Do NOT rely on a global install whose version nobody recorded.
3. Run `npx spectral --version` and write the version into `lint_report`.
4. If `spectral_ruleset` is given, use it unchanged. Otherwise create `.spectral.yaml` in the spec's directory with exactly:
   ```yaml
   extends: ["spectral:oas"]
   ```
   `spectral:oas` with no second argument enables the recommended rules of the built-in OpenAPI ruleset.
5. Do NOT disable rules in this phase. Rule overrides happen only in Phase 3 with a written reason.

### Output
Pinned Spectral install and a ruleset path.

### Quality Gate
- `npx spectral --version` exits 0 and prints a version string.
- The ruleset file exists and contains an `extends` key.

---

## Phase 2: Run and Read the Report

### Entry Criteria
- Spectral pinned, ruleset path known.

### Actions
1. Run the human-readable pass first:
   `npx spectral lint openapi.yaml --ruleset .spectral.yaml --format stylish`
2. Run the machine-readable pass and save it:
   `npx spectral lint openapi.yaml --ruleset .spectral.yaml --format json --output spectral-report.json`
3. Read `spectral-report.json`. Each entry has `code` (rule name), `message`, `path` (array of JSON path segments), `severity` and `range`. Severity numbers mean: `0` error, `1` warn, `2` info, `3` hint.
4. Count entries per severity and record them in `lint_report`.
5. Classify every severity 0 entry with this table:

| Rule code | What it means for an SDK | Fix type |
|---|---|---|
| `oas3-schema` / `oas2-schema` | The document is not a valid OpenAPI document; generators will fail or emit wrong code | Structural fix in spec |
| `operation-operationId-unique` | Two operations would generate the same method name | Rename one operationId |
| `path-params` | A `{param}` in the path has no matching parameter, or the reverse | Add or rename the parameter |
| `oas3-valid-media-example` / `oas3-valid-schema-example` | An example contradicts its schema; mock servers will serve invalid data | Fix the example, not the schema, unless the schema is wrong |
| `no-$ref-siblings` | Keywords next to `$ref` are ignored in OpenAPI 3.0 | Move keywords into the referenced schema or use `allOf` |
| `duplicated-entry-in-enum` | Generated enums will fail to compile | Remove the duplicate |
| `typed-enum` | Enum values do not match the declared type | Fix the value or the type |
| Any other code | Read the rule documentation in the Spectral OAS ruleset reference | Decide from the documentation, cite it |

### Output
`spectral-report.json` and a classified error list.

### Quality Gate
- `spectral-report.json` exists and parses as JSON (`node -e "JSON.parse(require('fs').readFileSync('spectral-report.json','utf8'))"` exits 0).
- Every severity 0 entry has a fix type from the table.

---

## Phase 3: Fix Errors One at a Time

### Entry Criteria
- Classified error list exists.

### Actions
1. If you do not own the spec (it belongs to another team or vendor), do NOT edit it. Copy it to `openapi.sdk.yaml` next to the original, fix the copy, and record every change as a spec defect in `lint_report` so the owner can apply it upstream.
2. Fix ONE error, then rerun `npx spectral lint <spec> --ruleset .spectral.yaml --fail-severity error`. Do not batch many edits before the rerun; a structural fix often clears or creates other errors.
3. If a rule is wrong for this API (rare), override it in the ruleset with a reason comment, for example:
   ```yaml
   extends: ["spectral:oas"]
   rules:
     # Internal API, no public contact block exists. Owner: platform team.
     info-contact: off
   ```
   Only `warn`, `info` and `hint` rules may be turned off. Never turn off `oas3-schema`, `operation-operationId-unique` or `path-params` to get a clean run.
4. Repeat until the run exits 0 with `--fail-severity error`.
5. Set `validated_spec` to the file that passes.

### Output
`validated_spec` and final `lint_report`.

### Quality Gate
- `npx spectral lint <validated_spec> --ruleset .spectral.yaml --fail-severity error` exits 0.
- The ruleset contains no `off` override for `oas3-schema`, `operation-operationId-unique` or `path-params` (`grep -E "(oas3-schema|operationId-unique|path-params):\s*off" .spectral.yaml` prints nothing).
- Every spec edit is listed in `lint_report`.

---

## Worked Example

Illustrative only. Input: `spec_path = api/openapi.yaml` (OpenAPI 3.0.3, 42 operations), no ruleset.

Phase 1 creates `api/.spectral.yaml` with `extends: ["spectral:oas"]`; `npx spectral --version` prints `6.x.y`.

Phase 2:
```
$ npx spectral lint api/openapi.yaml --ruleset api/.spectral.yaml --format stylish
api/openapi.yaml
 112:17  error  operation-operationId-unique  Every operation must have unique "operationId".  paths./v1/users.get.operationId
 240:11  error  path-params   Operation must define parameter "{invoiceId}" as expected by path "/v1/invoices/{invoiceId}".
  15:6   warning  info-contact  Info object must have "contact" object.
✖ 3 problems (2 errors, 1 warning, 0 infos, 0 hints)
```
Phase 3 renames the second `listUsers` to `listOrgUsers`, reruns (1 error left), adds the `invoiceId` path parameter, reruns: exit 0. The warning stays and is reported. `validated_spec = api/openapi.yaml`.

---

## Exit Criteria

DONE when `validated_spec` lints with zero severity 0 results under a ruleset that extends `spectral:oas`, and every change or override is recorded in `lint_report`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec is Swagger 2.0 | **Adjust**: convert with the official `swagger2openapi` tool or ask the owner for the 3.x spec, then restart Phase 1. |
| Phase 1 | `npx spectral` not found after install | **Retry**: run `npm ls @stoplight/spectral-cli`; reinstall once; if still missing, **Stop** and report the npm error text. |
| Phase 2 | Spectral fails to resolve an external `$ref` | **Adjust**: run from the spec's directory so relative refs resolve; if the ref points to a URL that is not reachable, **Stop** and report it. |
| Phase 3 | An error cannot be fixed without changing API behavior | **Return**: record it as a spec defect for the API owner; do not generate an SDK from a spec with `oas3-schema` errors. |
| Phase 3 | Fixing one error adds new ones repeatedly | **Stop**: report the loop with the rule codes involved instead of disabling rules. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
