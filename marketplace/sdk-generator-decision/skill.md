# SDK Generator Decision

**One-line description:** Chooses between a generated client (openapi-generator, openapi-typescript with openapi-fetch, oapi-codegen), a handwritten client, or a hybrid of generated models with a handwritten facade, using a decision table driven by the spec inventory and stated constraints.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `stack` (string, required): Target language: `python`, `typescript` or `go`.
- `sdk_constraints` (object, optional): User constraints, for example: zero runtime dependencies, minimum runtime version, whether the spec owner will accept spec fixes, whether the SDK is public, and the HTTP library already in use.

---

## Outputs

- `generation_plan` (object): `approach` (`generated`, `handwritten` or `hybrid`), `generator` with pinned version, generator options, the reasons (one row per decision table hit), and the list of concerns the handwritten layer must add (auth, retries, pagination, errors, timeouts).

---

## Phase 1: Check Generator Compatibility

### Entry Criteria
- `api_inventory.openapi_version` is known.
- `stack` is one of the three values.

### Actions
1. Pick the candidate generator for the stack:

| `stack` | Default candidate | Output style | Notes |
|---|---|---|---|
| `python` | openapi-generator, generator name `python` | Full package: pydantic v2 models, `ApiClient`, one API class per tag, urllib3 transport by default | `openapi-generator-cli config-help -g python` lists its options, including `library` |
| `typescript` | openapi-typescript (types only) plus openapi-fetch (runtime client) | One `.d.ts` file of `paths` and `components` types, about zero runtime code | Supports 3.0 and 3.1 |
| `go` | oapi-codegen v2 (`github.com/oapi-codegen/oapi-codegen/v2`) | One `.gen.go` file with models, `Client`, `ClientWithResponses` | Check its README for current OpenAPI 3.1 support before using it on a 3.1 spec |

2. Check the spec version against the candidate. If `openapi_version` starts with `3.1` and the candidate's documentation does not list 3.1 support, record `generator_incompatible = true`.
3. List spec features that generators commonly mishandle and check each in `build/openapi.json`: `oneOf`/`anyOf` without `discriminator`, `allOf` with more than one inline member, `additionalProperties` combined with `properties`, `type` arrays (3.1), recursive schemas, `multipart/form-data` bodies, and `nullable` on `$ref` siblings. Record which appear.
4. Do NOT claim a generator supports a feature from memory. For each listed feature, generate a small sample (Phase 2) or cite the generator documentation.

### Output
Compatibility notes per candidate.

### Quality Gate
- Each feature in Action 3 is marked present or absent with the jq command that showed it.
- `generator_incompatible` is set to true or false.

---

## Phase 2: Probe Generation

### Entry Criteria
- Compatibility notes exist.

### Actions
1. Generate once into a throwaway directory (never into the SDK repo):
   - python: `npx @openapitools/openapi-generator-cli generate -i build/openapi.bundled.yaml -g python -o /tmp/probe-py`
   - typescript: `npx openapi-typescript build/openapi.bundled.yaml -o /tmp/probe-ts/schema.d.ts`
   - go: `go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@<version> -generate types,client -package probe build/openapi.bundled.yaml > /tmp/probe-go/probe.gen.go`
2. Build the probe: python `python -m compileall -q /tmp/probe-py`; typescript `npx tsc --noEmit --strict /tmp/probe-ts/schema.d.ts`; go `cd /tmp/probe-go && go mod init probe && go mod tidy && go build ./...`.
3. Count generator warnings in the console output (lines with `WARN` for openapi-generator).
4. Search the probe for generated fallback names that signal lost type information: `grep -rE "InlineObject|InlineResponse|AnyOf|OneOf[0-9]|interface\{\}|map\[string\]interface\{\}|\bAny\b|unknown" /tmp/probe-*`. Record the count.

### Output
Probe build result and quality counts.

### Quality Gate
- Probe build command exit code is recorded.
- Fallback-name count is recorded with the grep command used.

---

## Phase 3: Decide

### Entry Criteria
- Probe results exist.

### Actions
1. Apply this table top to bottom; the first matching row decides:

| Condition | `approach` |
|---|---|
| Probe build failed and the spec cannot be fixed (owner refuses, no SDK spec copy allowed) | `handwritten` |
| `generator_incompatible` is true | `handwritten`, or `hybrid` with a different generator the user approves |
| `sdk_constraints` require zero runtime dependencies and stack is `python` or `go` | `hybrid` (generate models only, handwrite transport on the standard library) |
| SDK is public, and the user wants resource-style ergonomics (`client.users.list()`) that the generator does not produce | `hybrid` |
| Probe built, fallback count is zero or every fallback is on an operation the SDK will not expose | `generated` |
| Probe built but fallbacks appear on exposed operations | `hybrid`; list those operations for handwritten wrappers |

2. Pin the generator version in the plan: openapi-generator via `openapitools.json` (`npx @openapitools/openapi-generator-cli version-manager set <version>`), openapi-typescript and openapi-fetch via exact versions in `package.json`, oapi-codegen via `go get -tool github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@<version>` (Go 1.24 tool directive) or a `tools.go` file on older Go.
3. List the concerns the generator does not cover for this stack, so downstream flows run: retries (none of the three adds retry with backoff by default), pagination iterators, error hierarchy, token refresh, timeouts.
4. Write `generation_plan` with one reason row per table hit.

### Output
`generation_plan`.

### Quality Gate
- `generation_plan.approach` is one of the three values and cites the decision table row.
- The generator version is an exact version, not `latest`.

---

## Worked Example

Illustrative only. `stack = go`, spec 3.0.3, `sdk_constraints = { public: true }`.

Probe:
```
$ go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.x.y -generate types,client -package probe build/openapi.bundled.yaml > probe.gen.go
$ go build ./... && echo BUILD_OK
BUILD_OK
$ grep -cE "interface\{\}" probe.gen.go
3
```
The 3 hits are on `PATCH /v1/settings` (free-form object), which is exposed. Row "Probe built but fallbacks appear on exposed operations" decides `hybrid`; `generation_plan.handwritten_operations = ["updateSettings"]`.

---

## Exit Criteria

DONE when `generation_plan` names an approach from the table with its reason, a pinned generator version (or none for handwritten), and the list of concerns the downstream flows must add.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` is not python, typescript or go | **Stop**: these flows cover only the three stacks; report the request. |
| Phase 2 | Generator crashes on the spec | **Adjust**: rerun with `--verbose` (openapi-generator) and record the schema it failed on; treat as probe failure in Phase 3. |
| Phase 2 | Network blocked for `npx` or `go run` | **Stop**: report that the generator cannot be fetched; do not pick handwritten only because of the network. |
| Phase 3 | User constraints conflict (public SDK and no spec fixes and generator fails) | **Return**: present the conflict and the two cheapest options to the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
