# PR API and Compatibility Pass

**One-line description:** Lists every externally visible surface the PR touches (library exports, HTTP and RPC contracts, event schemas, CLI flags, config keys, environment variables, database columns read by other services), classifies each change as additive, behavioral or breaking with a decision table, checks the version bump against Semantic Versioning 2.0.0, and runs a stack API-diff tool where one exists.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diff_file` (string, required): Saved PR diff.
- `changed_files` (object[], required): Rename-aware file list.
- `intent_statement` (object, required): Intent sentence and acceptance criteria.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `compat_findings` (object[]): Breaking and behavioral compatibility findings, written to `<findings_dir>/prr-api-compat-pass.json`.
- `openapi_specs` (string[]): Paths of changed OpenAPI documents (`openapi*.yaml`, `openapi*.json`, `swagger*.json`), empty if none.

---

## Phase 1: Inventory Public Surfaces

### Entry Criteria
- `changed_files` exists.

### Actions
1. Mark each changed file that defines a surface someone outside this PR depends on:

| Surface | How to detect in the diff |
|---|---|
| Library exports | Python: names in `__all__` or without leading `_` in a published package; TS/JS: `export` in files reachable from `package.json` `main`/`exports`; Go: capitalized identifiers in non-`internal/` packages; Java: `public` in exported packages |
| HTTP API | route decorators, router files, OpenAPI documents, response serializers/DTOs |
| RPC and events | `*.proto`, `*.avsc`, JSON Schema files, message classes published to a queue or topic |
| CLI | argument parser definitions (`argparse`, `click`, `cobra`, `commander`) |
| Config and environment | settings files, `os.environ`/`process.env`/`os.Getenv` reads, Helm values |
| Database used by others | migrations on tables other services read (ask if unknown) |

2. Record OpenAPI documents in `openapi_specs`: `git diff --name-only origin/<base>...<head> | grep -iE '(openapi|swagger)[^/]*\.(ya?ml|json)$'`.

### Output
Surface list and `openapi_specs`.

### Quality Gate
- Every changed file is marked surface or internal.
- `openapi_specs` is recorded (empty list allowed).

---

## Phase 2: Classify Each Surface Change

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each surface change, use this table:

| Change | Class |
|---|---|
| New optional parameter with a default, new endpoint, new optional response field, new enum value consumers are told to tolerate | additive |
| Removed or renamed export, endpoint, field, flag, env var, or config key | breaking |
| New required parameter or request field | breaking |
| Parameter or field type narrowed, or nullability changed from optional to required (input) or required to optional (output) | breaking |
| Changed default value, changed error type or status code, changed ordering, changed units or time zone | behavioral (breaking for consumers that rely on it) |
| Enum value removed, or added in a schema consumers validate strictly | breaking |
| Protobuf field number reused or type changed | breaking (wire incompatible) |

2. Run a stack API-diff tool where available (check each tool's `--help`):

| Stack | Tool | Example |
|---|---|---|
| Python library | griffe | `griffe check <package> --against <base-ref>` |
| TypeScript library | API Extractor | `npx api-extractor run` and read the `.api.md` report diff |
| Go module | gorelease | `gorelease -base=<previous-tag>` (reports the required version bump) |
| Java library | japicmp | Maven/Gradle plugin per project docs |
| Rust crate | cargo-semver-checks | `cargo semver-checks` |
| Protobuf | buf | `buf breaking --against '.git#branch=<base>'` |

3. Check the version bump: for a published library, Semantic Versioning 2.0.0 requires a MAJOR bump for breaking changes (after 1.0.0), MINOR for additive, PATCH for fixes. Read the version in `pyproject.toml`, `package.json`, a Git tag plan, or the CHANGELOG entry.

### Output
Classified change list and tool output.

### Quality Gate
- Every surface change has a class.
- Tool output is recorded for each stack tool that applies, or "not installed".

---

## Phase 3: Record Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. Label:

| Situation | Label |
|---|---|
| Breaking change not named in `intent_statement` | blocking |
| Breaking change intended, but no version bump to MAJOR, no deprecation period, or no migration note | blocking |
| Behavioral change with no CHANGELOG or release note entry | question |
| Rename that could be done as add-new, deprecate-old | suggestion: keep the old name as a deprecated alias for one release |
| Additive change | none |

2. For HTTP and event consumers in other repositories, ask the author to name them; do not assume there are none.
3. Write `<findings_dir>/prr-api-compat-pass.json` (fields `flow`, `category`="compatibility", `file`, `line`, `evidence` = before and after signature or schema, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`compat_findings`, `openapi_specs`.

### Quality Gate
- Every breaking change has a finding or an explicit "intended, versioned, documented" note with the version line quoted.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Library `acme-money` 2.3.0. Diff:
```
-def format_amount(amount, currency="USD"):
+def format_amount(amount, currency):
```
and `openapi.yaml` unchanged.
- Phase 1: `format_amount` is exported (in `__all__`); `openapi_specs` = [].
- Phase 2: default removed means callers passing one argument now raise `TypeError`: breaking. `griffe check acme_money --against v2.3.0` prints `acme_money/fmt.py:12: format_amount(currency): Parameter default was removed`. Version in `pyproject.toml` is bumped to 2.4.0.
- Phase 3: blocking: "breaking change requires 3.0.0 or keep the default and emit `DeprecationWarning` when it is omitted".

---

## Exit Criteria

DONE when every external surface in the diff is classified as additive, behavioral or breaking, stack diff tools ran where available, version bumps are checked against SemVer, and OpenAPI documents are listed for contract diffing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unclear whether code is public (no `__all__`, monorepo consumers) | **Adjust**: search the monorepo for imports with `rg -n '<symbol>'`; any hit outside the package makes it public. |
| Phase 2 | API-diff tool not installed | **Adjust**: compare signatures by reading the diff and record "tool not run". |
| Phase 3 | Project is an application with no versioned API | **Adjust**: skip the SemVer check; keep the consumer checks for HTTP, events and config. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
