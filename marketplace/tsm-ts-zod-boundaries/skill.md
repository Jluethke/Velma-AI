# Runtime Validation at Boundaries With zod

**One-line description:** Finds every place untrusted data enters a TypeScript program (HTTP bodies, query strings, fetch responses, environment variables, files, queues, `localStorage`), validates it once at that boundary with a zod schema, and derives the static type from the schema with `z.infer` so the type and the runtime check cannot drift.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_unsafe_fixes` (object, required): From `tsm-ts-eliminate-any`; its `TODO(tsm-ts-zod-boundaries)` markers list known boundaries.
- `boundary_list` (string[], optional): Extra entry points the user names (for example `POST /orders`, `worker: invoice-queue`).

---

## Outputs

- `ts_boundary_validators` (object[]): One row per boundary: location (file and line), source kind, schema name and file, parse method (`parse` or `safeParse`), the error path taken on failure, and the test names covering one valid and one invalid input.

---

## Phase 1: Inventory the Boundaries

### Entry Criteria
- tsc exits 0 and the no-any lint rules pass.

### Actions
1. Collect markers: `grep -rn "TODO(tsm-ts-zod-boundaries)" src`.
2. Search for boundary sources the markers may have missed. Run each command and add every hit to the inventory:
   - `grep -rnE "JSON\.parse\(" src`
   - `grep -rnE "\.json\(\)" src` (fetch and HTTP client responses)
   - `grep -rnE "req\.(body|query|params|headers)" src` (Express, similar for Fastify `request.body`)
   - `grep -rnE "process\.env\." src`
   - `grep -rnE "localStorage|sessionStorage" src`
   - `grep -rnE "readFile(Sync)?\(" src`
   - Message consumers: grep the queue client's receive or subscribe call.
3. Add every entry from `boundary_list`.
4. Classify each hit with this table:

   | Source | Validate with | On failure |
   |---|---|---|
   | HTTP request body, query, params | `safeParse` | Respond 400 with `error.issues` mapped to field paths; do not echo raw input. |
   | Outgoing fetch response from another service | `parse` inside the client function | Throw a typed error naming the service; the caller's existing error handling applies. |
   | Environment variables at startup | `parse` once in `src/config.ts` | Process exits at startup with the list of invalid keys. |
   | File, queue message, `localStorage` | `safeParse` | Log and dead-letter or discard per existing behavior; record which. |

### Output
Boundary inventory with source class and failure behavior.

### Quality Gate
- Every grep command above was run and its hit count recorded.
- Every hit is either in the inventory or marked "not a boundary" with a reason (for example `JSON.parse` of a constant string).

---

## Phase 2: Write Schemas and Parse at the Boundary

### Entry Criteria
- Inventory complete. If the repo already uses another validator (valibot, arktype, io-ts, yup, ajv with JSON Schema), use that library with the same steps; do not add a second one.

### Actions
1. Install pinned: `npm install --save-exact zod`. Check the major: `npm ls zod`. Zod 3 and Zod 4 differ in error formatting helpers and some string formats; read the installed version's docs before using anything beyond `z.object`, `z.string`, `z.number`, `z.boolean`, `z.array`, `z.enum`, `z.literal`, `z.union`, `z.optional`, `z.nullable`, `z.coerce`, `parse`, `safeParse`, `z.infer`.
2. Write one schema per boundary in a `schemas/` file next to the boundary. Derive the type from it and delete the hand-written interface it replaces:
   ```ts
   import { z } from "zod";
   export const CreateOrder = z.object({
     customerId: z.string().uuid(),
     items: z.array(z.object({ sku: z.string().min(1), qty: z.number().int().positive() })).min(1),
     note: z.string().max(500).optional(),
   });
   export type CreateOrder = z.infer<typeof CreateOrder>;
   ```
   `z.object` strips unknown keys by default. If the boundary must reject unknown keys, use the strict object form documented for the installed version.
3. Parse exactly once, at the boundary, and pass the typed result inward:
   ```ts
   const parsed = CreateOrder.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ issues: parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })) });
   }
   await createOrder(parsed.data); // parsed.data: CreateOrder
   ```
4. Environment: one schema for all variables with `z.coerce.number()` for numbers and `z.enum([...])` for modes; parse in `src/config.ts`; everything else imports `config`, never `process.env` directly. Afterwards `grep -rn "process\.env\." src` should hit only `src/config.ts`.
5. Do not add validation deeper inside the program "to be safe"; internal functions trust their typed parameters. Duplicate validation drifts.
6. Remove the `TODO(tsm-ts-zod-boundaries)` marker and the temporary guard at each converted site.
7. For each boundary add two tests: a valid input is accepted and reaches the handler; an invalid input (wrong type in one field) produces the failure behavior from the table.
8. One boundary per commit: tsc, lint, `test_command`, then `types(boundary): <location>`.

### Output
`ts_boundary_validators`.

### Quality Gate
- `grep -rn "TODO(tsm-ts-zod-boundaries)" src` prints nothing.
- `grep -rn "process\.env\." src` hits only the config module.
- Each boundary row lists two test names, and `test_command` shows them passing.
- `grep -rnE "as (CreateOrder|<SchemaName>)" src` for each schema type prints nothing (no assertions bypassing the schema).

---

## Worked Example

Illustrative only. Express service, Zod 3.23.

Phase 1: markers 7; `req.body` hits 9 (2 extra beyond markers), `process.env.` hits 31 across 12 files, `.json()` hits 4 (calls to the pricing service).

Phase 2: `POST /orders` gets `CreateOrder` with `safeParse` and a 400 response. Test `rejects qty "2" as string` sends `{"customerId":"...","items":[{"sku":"A","qty":"2"}]}` and expects 400 with `issues[0].path === "items.0.qty"`. `src/config.ts` defines `Env = z.object({ PORT: z.coerce.number().int(), DATABASE_URL: z.string().url(), MODE: z.enum(["dev","prod"]) })`; after the change `grep -rn "process\.env\." src` returns only `src/config.ts`. The pricing client calls `PriceList.parse(await res.json())` and throws `PricingServiceError` on failure.

---

## Exit Criteria

DONE when every inventoried boundary parses through a schema whose `z.infer` type is the only type for that data, each has a valid and an invalid test, and no boundary marker remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A hit is ambiguous (data from a trusted internal module) | **Adjust**: record it as not a boundary with the reason; boundaries are where the program receives data it did not construct. |
| Phase 2 | Strict validation rejects real production traffic shapes | **Return**: report the field and observed shape to the user; widen the schema only with their decision. |
| Phase 2 | Existing tests sent invalid fixtures that used to pass | **Adjust**: fix the fixtures to match the documented contract; do not loosen the schema to fit bad fixtures. |
| Phase 2 | Validation added in many internal layers | **Retry**: remove the inner copies; parse once at the boundary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
