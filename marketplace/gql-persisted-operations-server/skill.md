# Enforce Persisted Operations on the Server

**One-line description:** Loads the trusted-documents manifest into the server and rejects any operation not in it, using the Yoga persisted operations plugin, an Apollo Server `didResolveSource` plugin, a gqlgen `AroundOperations` check with a read-only APQ cache, or a Strawberry extension, with tests for known and unknown documents.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `persisted_manifest` (string, required): Path to `persisted-documents.json` (hash to document).
- `project_dir` (string, required): Server root.
- `stack` (string, required): `apollo`, `yoga`, `python` or `go`.

---

## Outputs

- `persisted_enforcement` (string[]): Paths of the enforcement code and manifest loading.
- `persisted_tests` (string): Path to tests and passing output.

---

## Phase 1: Pick the Mechanism

### Entry Criteria
- Manifest keys verified as sha256 by `gql-persisted-documents-manifest`.

### Actions
1. Select by stack. Two modes exist: hash-only requests (client sends no text; true bandwidth saving) and full-text allowlist (client sends text; server hashes and checks).

| `stack` | Mechanism | Mode |
|---|---|---|
| `yoga` | `@graphql-yoga/plugin-persisted-operations`: `usePersistedOperations({ getPersistedOperation(key) { return manifest[key] ?? null }, allowArbitraryOperations: false })` | hash-only |
| `apollo` | custom plugin with `requestDidStart` returning `didResolveSource(rc)`: hash `rc.source` with sha256 and throw `GraphQLError('PersistedQueryNotFound', { extensions: { code: 'PERSISTED_QUERY_NOT_FOUND' } })` when absent; set `persistedQueries: false` so built-in APQ cannot register new text | full-text |
| `go` | `srv.AroundOperations`: hash `graphql.GetOperationContext(ctx).RawQuery`, reject when absent; optionally `srv.Use(extension.AutomaticPersistedQuery{Cache: readOnlyCache})` where `readOnlyCache` is pre-filled from the manifest and its `Add` does nothing, so hash-only requests work and nothing new registers | both |
| `python` | Strawberry `SchemaExtension` whose `on_operation` hashes `self.execution_context.query` and, when absent, sets an error result instead of executing (see Phase 2); Strawberry has no built-in persisted operations at the time of writing | full-text |

2. Confirm option names in each library's docs for your installed version before writing code.
3. Decide what happens in development: keep enforcement on in staging and production; allow arbitrary operations only when an explicit env var (for example `ALLOW_ARBITRARY_OPERATIONS=1`) is set locally.

### Output
Chosen mechanism and mode.

### Quality Gate
- The mechanism row and mode are recorded with the docs link checked.

---

## Phase 2: Implement

### Entry Criteria
- Mechanism chosen.

### Actions
1. Load the manifest once at startup into a map; fail startup if the file is missing or not valid JSON. Never fetch it per request from disk.
2. Implement the row for your stack. Go example:
```go
srv.AroundOperations(func(ctx context.Context, next graphql.OperationHandler) graphql.ResponseHandler {
	oc := graphql.GetOperationContext(ctx)
	sum := sha256.Sum256([]byte(oc.RawQuery))
	if _, ok := manifest[hex.EncodeToString(sum[:])]; !ok {
		return graphql.OneShot(graphql.ErrorResponse(ctx, "PersistedQueryNotFound"))
	}
	return next(ctx)
})
```
Python example (verify the `on_operation` and `execution_context.result` usage on the Strawberry "Extensions" docs page):
```python
class TrustedDocuments(SchemaExtension):
    def on_operation(self):
        q = self.execution_context.query or ""
        if hashlib.sha256(q.encode()).hexdigest() not in MANIFEST:
            self.execution_context.result = ExecutionResult(data=None,
                errors=[GraphQLError("PersistedQueryNotFound", extensions={"code": "PERSISTED_QUERY_NOT_FOUND"})])
        yield
```
If your Strawberry version still executes after setting the result, move the check into `on_execute` before `yield`, per its docs.
3. The hash must be computed on the exact bytes the client hashed. Full-text mode works only if the client sends the identical text stored in the manifest (no reformatting by a client library).
4. Log rejected hashes with client name and version headers; a spike after a release means a manifest was not deployed.

### Output
Enforcement code.

### Quality Gate
- Build or import passes for the stack.
- Startup with a missing manifest path exits non-zero with a clear message.

---

## Phase 3: Test

### Entry Criteria
- Enforcement implemented.

### Actions
1. Test A: every manifest entry executes without `PERSISTED_QUERY_NOT_FOUND` (send hash-only or full text as the mode requires).
2. Test B: an operation not in the manifest (for example `{ __schema { types { name } } }`) returns `PERSISTED_QUERY_NOT_FOUND` and no data.
3. Test C: a manifest operation with one character changed is rejected.
4. Run the suite for the stack (`npx vitest run`, `pytest -q`, `go test ./... -run Persisted -v`).

### Output
`persisted_enforcement`, `persisted_tests`.

### Quality Gate
- Tests A, B and C pass; test run exits 0.

---

## Worked Example

Illustrative only. `stack = yoga`.

```ts
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import manifest from './persisted-documents.json' with { type: 'json' };
const yoga = createYoga({ schema, plugins: [usePersistedOperations({
  getPersistedOperation: (key) => manifest[key] ?? null })] });
```
Test B request `{"query":"{ __schema { types { name } } }"}` returns an error (the plugin's default message is `PersistedQueryOnly` or similar; assert on the observed code). Hash request `{"extensions":{"persistedQuery":{"version":1,"sha256Hash":"5e8f...c09d"}}}` returns data. `Tests 3 passed`.

---

## Exit Criteria

DONE when the server accepts exactly the manifest operations, rejects all others with a stable code, and fails fast without a manifest.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Every request rejected after deploy | **Adjust**: hash algorithm or text mismatch; compare a client-sent hash to `sha256sum` of the stored text. |
| Phase 2 | Old app versions break | **Adjust**: merge their manifests into the loaded set; never replace with only the newest. |
| Phase 3 | Arbitrary query accepted | **Stop**: enforcement is bypassed (APQ registration still on, or dev flag set); fix before release. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
