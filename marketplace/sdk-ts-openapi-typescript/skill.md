# SDK TypeScript openapi-typescript Client

**One-line description:** Generates TypeScript types from the spec with openapi-typescript, wraps them in an openapi-fetch client with auth and User-Agent middleware, adds a CI check that the generated file is current, and proves the types reject a wrong call at compile time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): Path to the validated spec.
- `generation_plan` (object, required): Output of `sdk-generator-decision`; generator must be openapi-typescript.
- `type_mapping` (object, required): Output of `sdk-model-type-mapping`; decides flags such as `--enum`.
- `project_dir` (string, required): SDK repository root with `package.json` and `tsconfig.json`.

---

## Outputs

- `ts_client_module` (object): Path of the generated `schema.d.ts`, flags used, pinned versions, the client factory file, and results of `tsc --noEmit` and the negative type test.

---

## Phase 1: Generate Types

### Entry Criteria
- Node.js 18 or later (`node --version`).
- `tsconfig.json` has `"strict": true`.

### Actions
1. Install exact versions: `npm install --save-exact --save-dev openapi-typescript typescript` and `npm install --save-exact openapi-fetch`.
2. Print the real flags: `npx openapi-typescript --help`. Use only flags listed there.
3. Add a script to `package.json`:
   ```json
   "scripts": { "generate": "openapi-typescript api/openapi.yaml -o src/generated/schema.d.ts" }
   ```
   Add `--enum` only if `type_mapping` asks for runtime enums. Add `--alphabetize` if the team wants stable diffs regardless of spec order.
4. Run `npm run generate`.
5. The output exports `paths`, `components` and `operations` interfaces. Do NOT edit `schema.d.ts`; it is regenerated.

### Output
`src/generated/schema.d.ts`.

### Quality Gate
- `npm run generate` exits 0.
- `grep -c "export interface paths" src/generated/schema.d.ts` prints 1.

---

## Phase 2: Build the Client Factory

### Entry Criteria
- Types generated.

### Actions
1. Create `src/client.ts`:
   ```ts
   import createClient, { type Middleware } from "openapi-fetch";
   import type { paths } from "./generated/schema";
   import { VERSION } from "./version";

   export interface ClientOptions { baseUrl: string; apiKey: string; fetch?: typeof fetch; }

   export function createAcmeClient(opts: ClientOptions) {
     const client = createClient<paths>({ baseUrl: opts.baseUrl, fetch: opts.fetch });
     const auth: Middleware = {
       onRequest({ request }) {
         request.headers.set("X-API-Key", opts.apiKey);
         request.headers.set("User-Agent", `acme-node/${VERSION}`);
         return request;
       },
     };
     client.use(auth);
     return client;
   }
   ```
   Replace the header name with the one in `api_inventory.auth_schemes`.
2. Calls look like `const { data, error, response } = await client.GET("/v1/users/{id}", { params: { path: { id } } });`. `data` and `error` are typed from the spec's success and error responses.
3. Do NOT invent methods on the openapi-fetch client. Its request methods are the uppercase HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, `TRACE`) plus `use` and `eject` for middleware; check the openapi-fetch documentation for the installed version.
4. Set `VERSION` from `package.json` at build time; do not hardcode a second copy that can drift.

### Output
`src/client.ts`.

### Quality Gate
- `npx tsc --noEmit` exits 0.

---

## Phase 3: Prove the Types Bite and Stay Current

### Entry Criteria
- Client compiles.

### Actions
1. Create `src/__typetests__/client.typetest.ts` with a call that must fail:
   ```ts
   import { createAcmeClient } from "../client";
   const c = createAcmeClient({ baseUrl: "http://localhost", apiKey: "k" });
   // @ts-expect-error path param id is required
   c.GET("/v1/users/{id}", {});
   // @ts-expect-error path does not exist in the spec
   c.GET("/v1/does-not-exist");
   ```
   `@ts-expect-error` makes `tsc` fail if the next line does NOT error, so this proves the types are live.
2. Run `npx tsc --noEmit`. Exit 0 means both lines errored as expected.
3. Mutation check: delete one `@ts-expect-error` line's error cause (for example add `params: { path: { id: "1" } }`) and rerun; `tsc` must now fail with `Unused '@ts-expect-error' directive`. Revert.
4. Add a drift check for CI: `npm run generate && git diff --exit-code src/generated/schema.d.ts`. A non-zero exit means someone changed the spec without regenerating.

### Output
`ts_client_module`.

### Quality Gate
- `npx tsc --noEmit` exits 0 with the type test file included in `tsconfig.json` `include`.
- The mutation in Action 3 produced the `Unused '@ts-expect-error' directive` error.
- The drift command exits 0 on a clean tree.

---

## Worked Example

Illustrative only.

```
$ npm run generate
✨ openapi-typescript 7.x.y
🚀 api/openapi.yaml → src/generated/schema.d.ts [120ms]
$ npx tsc --noEmit && echo TYPES_OK
TYPES_OK
$ # mutation: give the first call a valid id
$ npx tsc --noEmit
src/__typetests__/client.typetest.ts:4:1 - error TS2578: Unused '@ts-expect-error' directive.
```
After reverting, `TYPES_OK` again. `ts_client_module = { schema: "src/generated/schema.d.ts", flags: [], openapi_typescript: "7.x.y", openapi_fetch: "0.x.y" }`.

---

## Exit Criteria

DONE when types are generated from pinned versions, the client factory compiles under `strict`, the negative type tests prove the types are enforced, and the drift check passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Generator errors on a schema | **Return**: send the schema path to `sdk-spec-sdk-readiness-rules`; do not hand-edit the output. |
| Phase 2 | `tsc` errors inside `schema.d.ts` | **Adjust**: check `skipLibCheck` is not hiding it and that the TypeScript version meets the openapi-typescript requirement in its README. |
| Phase 3 | `@ts-expect-error` lines do not error | **Stop**: the client is typed as `any` somewhere; find it (`grep -n "any" src/client.ts`) before continuing. |
| Phase 3 | Drift check fails in CI | **Retry**: run `npm run generate`, commit the result, rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
