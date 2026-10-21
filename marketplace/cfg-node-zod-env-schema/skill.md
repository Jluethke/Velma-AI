# Node Config Schema With Zod

**One-line description:** Builds one `env.ts` module that parses `process.env` through a zod schema at process start (coercing numbers, parsing booleans correctly, rejecting missing secrets), exports the typed result as the only config access path, bans direct `process.env` reads with an ESLint rule, and proves the failure path prints field names but never values.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`.
- `layering_spec` (object, required): Layer order from `cfg-env-layering-precedence`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `config_schema_module` (string): Path of the module created, for example `src/env.ts`.
- `startup_validation_command` (string): A command that starts the app with an empty environment and must exit non-zero with a validation message, plus the expected message text.

---

## Phase 1: Write The Schema Module

### Entry Criteria
- `node --version` prints a version, and `npm ls zod` shows zod installed. If not, run `npm install zod` (or the project's package manager: `pnpm add zod`, `yarn add zod`). Record the installed major version from `npm ls zod`; zod 3 and zod 4 differ in a few APIs noted below.

### Actions
1. Create `src/env.ts` (or `src/env.js` in a JavaScript project). Edit only this file in this phase.
2. Map each `config_keys` row with this table.

| `type` / `class` | zod declaration |
|---|---|
| secret | `z.string().min(1)` |
| url | `z.string().url()` (zod 4 also offers `z.url()`) |
| int | `z.coerce.number().int().min(1).max(65535)` for ports (TCP range); for other ints use bounds from `config_keys` or none |
| bool | `z.enum(["true", "false"]).transform((v) => v === "true")`, or `z.stringbool()` in zod 4 |
| enum | `z.enum(["debug", "info", "warn", "error"])` |
| list | `z.string().transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))` |
| optional with default | append `.default("info")` |

   Never use `z.coerce.boolean()` for env flags: it calls `Boolean(value)`, so the string `"false"` becomes `true`.
3. Write the module:
```ts
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  STRIPE_KEY: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    console.error(`config error: ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(78); // EX_CONFIG from BSD sysexits.h
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;
```
   Print only `issue.path` and `issue.message`. Do not print `parsed.error` directly or `JSON.stringify(parsed.error)`; in some versions and custom messages the received value can appear.
4. `z.object` strips unknown keys by default, which is required here because `process.env` holds unrelated variables. Do not use `.strict()` on the environment schema.

### Output
`src/env.ts` with one schema entry per non-constant key.

### Quality Gate
- `npx tsc --noEmit` exits 0 (TypeScript projects), or `node --check src/env.js` exits 0 (JavaScript).
- The number of keys in `EnvSchema` equals the count of `config_keys` rows with class `secret` or `deploy-config`.

---

## Phase 2: Make env.ts The Only Access Path

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Import `env` at the top of the entry file (`src/index.ts`, `src/server.ts`) as the first application import, so validation runs before the server listens or connects.
2. Load layer 4 (local `.env`) only in development, per `layering_spec`. Options in order of preference: Node's built-in `--env-file` (Node 20.6 and later; check `node --help | grep env-file`) in the `dev` script only; or `import "dotenv/config"` guarded behind the dev script with `node -r dotenv/config`. dotenv does not override variables that are already set unless `override: true` is passed; do not pass it.
3. Replace each direct `process.env.X` read from the inventory with `env.X`. Change one file, run `npm test`, then continue.
4. Add the ESLint rule that forbids new direct reads. With `eslint-plugin-n` installed: `"n/no-process-env": "error"` in the config, and disable it for `src/env.ts` only (an `overrides` or flat-config `files` block). Check the rule exists in your installed plugin version with `npx eslint --print-config src/index.ts | grep no-process-env`.

### Output
All config reads go through `env`.

### Quality Gate
- `rg -n 'process\.env' src/ -g '!src/env.ts'` returns nothing (or only documented exceptions).
- `npx eslint src/` exits 0, and adding a temporary `process.env.FOO` line to another file makes it report `n/no-process-env` (mutation check; remove the line after).

---

## Phase 3: Prove The Failure Path And Redaction

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Build `startup_validation_command`: `env -i PATH="$PATH" node dist/index.js; echo "exit=$?"` (build first with `npm run build`), or `env -i PATH="$PATH" npx tsx src/index.ts`. Expected: lines starting `config error: DATABASE_URL:` and `exit=78`.
2. Add a unit test (vitest shown; jest is the same with `jest.resetModules()`):
```ts
it("rejects a missing secret without echoing values", async () => {
  vi.resetModules();
  const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
  const err = vi.spyOn(console, "error").mockImplementation(() => {});
  process.env = { PORT: "3000", DATABASE_URL: "postgres://u:FAKE-SECRET-123@h/db" };
  await expect(import("../src/env")).rejects.toThrow("exit");
  expect(exit).toHaveBeenCalledWith(78);
  expect(err.mock.calls.flat().join(" ")).not.toContain("FAKE-SECRET-123");
});
```
   Save and restore `process.env` in `beforeEach`/`afterEach`.
3. Add a boolean test: `FEATURE_X="false"` must parse to `false`. This catches the `z.coerce.boolean()` mistake.
4. Run `npm test` and record the summary line.

### Output
`config_schema_module`, `startup_validation_command`.

### Quality Gate
- The empty-environment start prints `exit=78`.
- `npm test` exits 0 and the boolean test fails when the schema is temporarily changed to `z.coerce.boolean()` (mutation check; restore afterwards).

---

## Common Mistakes To Avoid

- Do not read `process.env` in modules imported before `env.ts`; they run before validation.
- Do not use `z.coerce.boolean()` or `!!process.env.X` for flags.
- Do not commit `.env`; commit `.env.example` only (see `cfg-local-dev-secrets-setup`).
- Do not expose server secrets to browser bundles. In Vite only `VITE_`-prefixed variables reach `import.meta.env`; in Next.js only `NEXT_PUBLIC_` variables reach the client. Never give a secret one of those prefixes.

---

## Worked Example

Illustrative. Express API, zod 3, keys `DATABASE_URL`, `STRIPE_KEY`, `PORT`, `FEATURE_REFUNDS` (bool).

Phase 1: `src/env.ts` with 5 keys (including `NODE_ENV`), `FEATURE_REFUNDS: z.enum(["true","false"]).default("false").transform(v => v === "true")`.

Phase 2: `rg -n 'process\.env' src/ -g '!src/env.ts'` prints nothing; ESLint mutation line reports `error  Unexpected use of process.env  n/no-process-env`.

Phase 3:
```
$ env -i PATH="$PATH" node dist/index.js; echo "exit=$?"
config error: DATABASE_URL: Required
config error: STRIPE_KEY: Required
exit=78
$ npm test
 Test Files  3 passed (3)
      Tests  11 passed (11)
```

---

## Exit Criteria

DONE when `env.ts` validates every config key at startup, it is the only `process.env` reader enforced by lint, the empty-environment start exits 78 naming fields only, and the boolean and redaction tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project uses ESM and top-level `process.exit` breaks a test runner | **Adjust**: export a `loadEnv()` function that throws, and call it plus `process.exit(78)` in the entry file only. |
| Phase 2 | A dependency reads `process.env` itself (for example `DEBUG`) | **Adjust**: leave it; the lint rule covers only `src/`. |
| Phase 2 | `n/no-process-env` not found | **Adjust**: use core ESLint `no-restricted-properties` with `object: "process", property: "env"`. |
| Phase 3 | Secret value appears in output | **Stop**: replace any `console.error(parsed.error)` with the path and message loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
