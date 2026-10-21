# Node.js Request Validation With Zod

**One-line description:** Validates every Node.js (Express, Fastify, Next.js route handler) request body, query and params with a strict Zod schema through `safeParse`, rejects unknown keys instead of stripping them, caps body size at the parser, and proves rejection with Jest or Vitest tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `entry_point_inventory` (object[], required): Output of `ival-entry-point-inventory`.
- `field_rules` (object[], optional): Per-field limits from the product owner. Fields without a rule get limits from Phase 1 sources or become open questions.

---

## Outputs

- `zod_changes` (object): `schemas` (file and export name per entry point), `middleware_file`, `open_questions`, `test_file`, and `test_run` (the test runner summary).

---

## Phase 1: Confirm Versions and Derive Field Contracts

### Entry Criteria
- `package.json` exists in `repo_path`.

### Actions
1. Run `npm ls zod`. Decision table:

| Output | Action |
|---|---|
| `zod@3.x` | use `z.object({...}).strict()` |
| `zod@4.x` | use `z.strictObject({...})` (`.strict()` still works in v4; prefer the v4 form in new code) |
| `(empty)` | `npm install zod` and record the installed version |

2. Derive each field's type and bound in this order, and stop at the first source that has one: `field_rules`; the database column (`rg -n "varchar\(|VarChar|@db\.VarChar|STRING\(" -g "*.{ts,js,prisma,sql}"`); a named standard (cite it); an enumerated set in code. If none applies, record the field in `open_questions`. Do NOT make up a maximum length.
3. Check the body parser limit. Express `express.json()` defaults to a `limit` of `"100kb"` (body-parser documentation). Fastify's `bodyLimit` defaults to 1 MiB (Fastify server options documentation). Record the current value; change it only to a number from `field_rules`.

### Output
Field contract table and parser limit record.

### Quality Gate
- `npm ls zod` prints one installed version.
- Every field has a type and either a cited bound source or an `open_questions` row.

---

## Phase 2: Write Schemas and the Validation Middleware

### Entry Criteria
- Contract table exists.

### Actions
1. Create `src/schemas/<area>.ts`:

```ts
import { z } from "zod";

export const CreateOrder = z.object({
  sku: z.string().trim().min(1).max(64).regex(/^[A-Z0-9-]+$/),
  quantity: z.number().int().min(1).max(999),       // field_rules row 4
  currency: z.enum(["USD", "EUR"]),
  note: z.string().max(500).optional(),
}).strict();                                         // zod 4: z.strictObject({...})

export const OrderQuery = z.object({
  page: z.coerce.number().int().min(1),              // query strings are strings; coerce, then bound
  status: z.enum(["open", "paid", "void"]).optional(),
}).strict();
```

2. Rules:
   - Every request object uses strict mode. The default `z.object` strips unknown keys silently, which hides `{"isAdmin": true}` attempts and lets a typo pass.
   - Use `z.coerce` only for query and path params, never for JSON bodies.
   - Regexes in `.regex()` run on the V8 backtracking engine. Keep them free of nested quantifiers and run `ival-redos-regex-audit` on each one.
   - Never call `.passthrough()` or `.catchall(z.any())` on a request schema.
3. Create `src/middleware/validate.ts` for Express:

```ts
import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (part: "body" | "query" | "params", schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const r = schema.safeParse(req[part]);
    if (!r.success) {
      return res.status(400).json({
        errors: r.error.issues.map(i => ({ path: i.path.join("."), code: i.code, message: i.message })),
      });
    }
    res.locals[part] = r.data;   // handlers read res.locals, never req[part]
    next();
  };
```

   Do not echo `i.input` or the raw value in the response. In Express 5, `req.query` is a getter and cannot be reassigned, which is why the parsed value goes to `res.locals`.
4. Fastify: pass the schema through `fastify-type-provider-zod` (check its README for the current setup calls) or call `safeParse` in a `preValidation` hook. Next.js route handler: `const r = Schema.safeParse(await request.json())` then `return Response.json({...}, { status: 400 })`.
5. Change one route at a time, update its handler to read `res.locals.body`, run its tests, then move on.

### Output
Schemas, middleware, wired routes.

### Quality Gate
- `rg -n "\.passthrough\(|catchall\(" src` prints nothing.
- `rg -n "req\.body\." src/routes` prints nothing for routes that now validate (handlers read `res.locals.body`).
- `npx tsc --noEmit` exits 0 (TypeScript projects).

---

## Phase 3: Prove Rejection With Tests

### Entry Criteria
- Routes wired.

### Actions
1. Write `test/schemas.<area>.test.ts` (Vitest or Jest, matching the repo's runner from `package.json` `scripts.test`):

```ts
import { CreateOrder } from "../src/schemas/orders";
const good = { sku: "AB-1", quantity: 1, currency: "USD" };

test.each([
  [{ isAdmin: true }],          // unknown key
  [{ quantity: "1" }],          // string, no coercion on body
  [{ quantity: 0 }], [{ quantity: 1000 }],
  [{ currency: "BTC" }],
  [{ sku: "ab 1;--" }],
])("rejects %j", (patch) => {
  expect(CreateOrder.safeParse({ ...good, ...patch }).success).toBe(false);
});

test("accepts good", () => expect(CreateOrder.safeParse(good).success).toBe(true));
```

2. Add one HTTP test per route with `supertest`: post an unknown key, assert status 400; post an oversize body larger than the parser limit, assert status 413.
3. Run `npm test -- schemas` and record the summary.
4. Mutation check: remove `.strict()` from one schema, rerun, confirm the unknown-key case fails, restore, rerun green.

### Output
`zod_changes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run shows 1 or more failed; restored run shows 0 failed.

---

## Worked Example

Illustrative. Express 4 app, `npm ls zod` prints `zod@3.23.8`. Route `POST /orders` (EP-001) previously did `const { sku, quantity } = req.body`.

Phase 2: `router.post("/orders", validate("body", CreateOrder), createOrder)`; handler reads `res.locals.body`.

Phase 3:
```
$ npx vitest run schemas
 ✓ test/schemas.orders.test.ts (9)
 Test Files  1 passed (1)
      Tests  9 passed (9)
```
Mutation without `.strict()`: `Tests  1 failed | 8 passed (9)`.

---

## Exit Criteria

DONE when every relevant route validates body, query and params with a strict Zod schema via `safeParse`, handlers read only parsed data, and tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project already uses Joi, Yup or class-validator | **Return**: report it; adding a second validator library is the owner's decision. Strictness rules still apply (Joi: default `allowUnknown: false`; class-validator: `forbidNonWhitelisted: true` with `whitelist: true`). |
| Phase 2 | TypeScript errors after switching handlers to `res.locals` | **Adjust**: type with `z.infer<typeof CreateOrder>`; do not cast to `any`. |
| Phase 2 | Clients send extra keys | **Return**: list them; do not loosen to strip mode silently. |
| Phase 3 | Test fails | **Adjust** the schema or handler; never delete or weaken the test. |
| Phase 3 | Mutation still green | **Stop**: the middleware is not mounted on that route. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
