# Persisted Documents Manifest From Client Operations

**One-line description:** Generates a trusted-documents manifest (`sha256 hash -> document text`) from the client's operations with GraphQL Code Generator's client preset `persistedDocuments` option, makes the client send only the hash, and checks the manifest is deterministic and complete.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Client operation files (or the client source that contains `graphql()` calls).
- `project_dir` (string, required): Client project root where codegen runs.

---

## Outputs

- `persisted_manifest` (string): Path to `persisted-documents.json` mapping each hash to its exact document text.

---

## Phase 1: Choose the Model

### Entry Criteria
- All client operations are static documents (no string concatenation building queries at runtime).

### Actions
1. Decide the model with this table:

| Need | Model |
|---|---|
| Block every operation not shipped by your own clients | Trusted documents (allowlist): the server accepts only hashes in the manifest |
| Only save bandwidth, public API open to third parties | Automatic Persisted Queries (APQ): client sends hash, server caches text on first miss; no allowlist |

2. This flow builds the manifest for trusted documents. APQ needs no manifest; skip to the server flow if APQ is the choice and record it.
3. Find runtime-built queries: `grep -rn "gql\`.*\${" src/` (template interpolation inside query text). Each one must be rewritten to use variables before persisting; a dynamic document cannot be in a static manifest.

### Output
Model decision; list of dynamic documents to fix.

### Quality Gate
- The grep for interpolated query text prints nothing after fixes.

---

## Phase 2: Generate the Manifest

### Entry Criteria
- All documents are static.

### Actions
1. `npm i -D @graphql-codegen/cli @graphql-codegen/client-preset`.
2. `codegen.ts`:
```ts
const config: CodegenConfig = {
  schema: '../server/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', 'operations/**/*.graphql'],
  generates: { './src/gql/': { preset: 'client',
    presetConfig: { persistedDocuments: { mode: 'embedHashInDocument', hashAlgorithm: 'sha256' } } } },
};
```
Set `hashAlgorithm: 'sha256'` explicitly: the default in the client preset docs has been `sha1`, and servers commonly expect sha256. Check the client preset docs for the option names in your version.
3. Run `npx graphql-codegen`. It writes `src/gql/persisted-documents.json`.
4. Configure the client to send `{"documentId": "<hash>", "variables": {...}}` or the APQ-style `extensions.persistedQuery.sha256Hash` shape, whichever the server flow expects. Record the wire format in the manifest notes; the server must read the same key.

### Output
`persisted-documents.json`.

### Quality Gate
- `node -e "const m=require('./src/gql/persisted-documents.json');console.log(Object.keys(m).length)"` prints the number of operations in the client.
- Every key is 64 hex characters: `node -e "const m=require('./src/gql/persisted-documents.json');console.log(Object.keys(m).every(k=>/^[0-9a-f]{64}$/.test(k)))"` prints `true`.

---

## Phase 3: Verify Determinism and Hashes

### Entry Criteria
- Manifest exists.

### Actions
1. Recompute one hash independently: take a manifest value, write it to a file exactly (no trailing newline), and run `sha256sum file` (or `shasum -a 256`). The digest must equal the key. A mismatch means the client hashes a different text than it stores (whitespace or fragment order).
2. Run codegen twice and compare: `npx graphql-codegen && cp src/gql/persisted-documents.json /tmp/a.json && npx graphql-codegen && diff /tmp/a.json src/gql/persisted-documents.json` prints nothing.
3. Commit the manifest with the client release. The server must load the manifest of every client version still in use, so keep old manifests (merge, never replace) until the old client is retired.
4. Validate manifest documents against the server schema: extract values into files and run `npx @graphql-inspector/cli validate "<dir>/*.graphql" schema.graphql`.

### Output
`persisted_manifest`.

### Quality Gate
- Independent `sha256sum` digest equals the manifest key for the sampled entry.
- The double-run diff prints nothing.
- Inspector validate exits 0.

---

## Worked Example

Illustrative only.

Phase 2: `npx graphql-codegen` prints `[SUCCESS] Generate to ./src/gql/`. Manifest excerpt:
```json
{ "5e8f1a...c09d": "query CustomerOrders($first: Int, $after: String) { viewer { orders(first: $first, after: $after) { edges { cursor node { id number } } pageInfo { hasNextPage endCursor } } } }" }
```
Phase 3: `printf '%s' "$(node -e "...print value...")" | sha256sum` prints `5e8f1a...c09d  -`, matching. Double-run diff: empty.

---

## Exit Criteria

DONE when the manifest contains one sha256 entry per client operation, hashes verify independently, generation is deterministic, and every entry validates against the schema.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dynamic queries cannot be removed | **Return**: report them to the client owner; they cannot use trusted documents until fixed. |
| Phase 2 | `persistedDocuments` option unknown | **Adjust**: upgrade `@graphql-codegen/client-preset`; check its changelog for the version that added it. |
| Phase 3 | Hash mismatch | **Adjust**: hash the exact stored text with no added newline; if still different, the client normalizes text; use the client's own hash output. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
