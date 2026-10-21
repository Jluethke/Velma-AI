# TypeScript Result Types and Error Cause

**One-line description:** Applies the triage actions to TypeScript code one file at a time: `unknown` in every catch with narrowing, `Error` subclasses with a stable `name` and ES2022 `cause`, a discriminated-union `Result` type for expected domain failures, no floating promises, and explicit handling of `AggregateError` and `Promise.allSettled` results.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root containing `package.json` and `tsconfig.json`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.
- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `logging_policy` (object, required): From `errh-log-once-at-boundary`.
- `test_command` (string, required): For example `npm test` or `pnpm vitest run`.

---

## Outputs

- `ts_error_changes` (object): `{ tsconfig_changes, error_classes, result_type_file, sites_fixed, test_runs }`.

---

## Phase 1: Compiler Settings and Base Types

### Entry Criteria
- `npx tsc --version` and Node version (`node --version`) recorded. `Error` `cause` needs `lib` including `es2022` (or later) and Node 16.9+.

### Actions
1. In `tsconfig.json` ensure `"strict": true` (which enables `useUnknownInCatchVariables`, TS 4.4+) and `"lib"` or `"target"` at `ES2022` or later. Run `npx tsc --noEmit` and record new errors; they are catch variables used as `any`. Fix them in Phase 2, file by file.
2. Create `src/errors.ts`:
```ts
export abstract class AppError extends Error {
  abstract readonly taxonomyClass: string;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}
export class NotFoundError extends AppError { readonly taxonomyClass = "not_found"; }
export class ConflictError extends AppError { readonly taxonomyClass = "conflict"; }
export class DependencyUnavailableError extends AppError { readonly taxonomyClass = "dependency_transient"; }

export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e), { cause: e });
}
```
3. `this.name = new.target.name` can be changed by minifiers; if the build minifies class names, assign literal names in each subclass instead. `Object.setPrototypeOf(this, new.target.prototype)` is only needed when compiling to ES5.
4. Result type for expected failures callers must branch on:
```ts
export type Result<T, E extends AppError = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E extends AppError>(error: E): Result<never, E> => ({ ok: false, error });
```
   If the repo already uses `neverthrow` or `effect`, use that instead; do not add a second Result type.

### Output
Settings and base types.

### Quality Gate
- `npx tsc --noEmit` error count is recorded (may be non-zero until Phase 2 finishes).
- `test_command` matches baseline.

---

## Phase 2: Apply Triage Actions per File

### Entry Criteria
- Base types exist.

### Actions
1. Decide throw or Result with this table:

| Situation | Use |
|---|---|
| expected class (not_found, conflict, validation) returned to a caller that branches | `Result` |
| unexpected class (bug, dependency_permanent) | `throw` |
| dependency_transient inside a retry wrapper | `throw` (retry libraries expect rejections) |
| at an HTTP boundary | `throw` an `AppError`; the error middleware maps it |

2. Apply each action:

| action | TypeScript idiom |
|---|---|
| `propagate` | delete the `try/catch`; or `catch (e) { throw e; }` is also deleted |
| `wrap_with_cause` | `catch (e: unknown) { throw new DependencyUnavailableError(\`fetch rates ${ccy}\`, { cause: e }); }` |
| `wrap_no_log` | delete `console.error`/`logger.error`; keep the wrap |
| `convert_domain` | `if (row === undefined) return err(new NotFoundError(\`invoice ${id}\`));` |
| `narrow` | `catch (e: unknown) { if (e instanceof SyntaxError) { ... } throw e; }` |
| `string_match` | replace `e.message.includes(...)` with `instanceof` or a `code` property check (`(e as NodeJS.ErrnoException).code === "ENOENT"` after `e instanceof Error`) |
| `keep_documented` | narrow check plus a comment naming the contract |
| throwing strings (`TS-THROWSTR`) | `throw new AppErrorSubclass(...)` |

3. Promises: every promise is awaited, returned, or passed to a handler. `void promise` is allowed only with a `.catch` that routes to the boundary logger. Parallel work: `Promise.all` rejects on the first failure and leaves others running; use `Promise.allSettled` when every result matters and inspect each `status: "rejected"` `reason`. `Promise.any` rejects with `AggregateError`; read `.errors`.
4. Run `test_command` after each file; next file only on pass.

### Output
Fixed files.

### Quality Gate
- `git diff --stat` per step shows one source file (plus its test).
- `npx tsc --noEmit` exits 0 at the end of the phase.
- `rg -n --type ts "catch\s*\(\s*\w+\s*:\s*any\s*\)"` returns nothing.

---

## Phase 3: Verify the Chain and Process Hooks

### Entry Criteria
- Phase 2 done.

### Actions
1. Since Node 15 the default for unhandled rejections is `throw` (process exits). Keep it. Add one `process.on("unhandledRejection", ...)` and `process.on("uncaughtException", ...)` only to log once and exit non-zero; never to continue running.
2. Print one wrapped error with `console.log(util.inspect(err, { depth: 5 }))` in a scratch script outside the repo and confirm the `[cause]` section shows the original.
3. Fill `ts_error_changes`.

### Output
`ts_error_changes`.

### Quality Gate
- The inspect output contains `[cause]: ` followed by the original error.
- `test_command` passes; summary recorded.

---

## Worked Example

Illustrative. Row: `src/rates.ts:18 observed=empty`.

Before:
```ts
try { return await fetchRates(ccy); } catch {}
return undefined;
```
After:
```ts
try {
  return await fetchRates(ccy);
} catch (e: unknown) {
  throw new DependencyUnavailableError(`fetch rates ${ccy}`, { cause: e });
}
```
```
$ npx tsc --noEmit && npx vitest run src/rates.test.ts
 ✓ src/rates.test.ts (4 tests)
```
A caller that checked `=== undefined` now gets a rejection; fix it in its own file step.

---

## Exit Criteria

DONE when every catch types its variable as `unknown`, every wrap passes `cause`, expected failures that callers branch on are `Result` values, no promise floats, and `tsc --noEmit` and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target below ES2022 and cannot change | **Adjust**: add a `cause` property on `AppError` manually and document it; check that the logger renders it. |
| Phase 2 | Converting a throwing function to `Result` breaks many callers | **Adjust**: keep it throwing; Result only for new or leaf functions; record the decision. |
| Phase 2 | Error class `instanceof` fails across packages | **Adjust**: two copies of the package are installed (`npm ls <pkg>`); dedupe, or check `e.name` plus a brand property. |
| Phase 2 | Tests fail after removing a swallow | **Adjust**: fix the caller next; never re-add the swallow or skip the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
