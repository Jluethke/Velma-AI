# TypeScript PR Static Checks with tsc and ESLint

**One-line description:** Runs `tsc --noEmit` against every tsconfig project and ESLint with the repository's own config on the PR head and base, keeps only diagnostics on changed lines, confirms the type-aware promise rules are active, and flags every new `any`, `@ts-ignore`, non-null assertion and double cast.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `ts_static_findings` (object[]): New type and lint diagnostics plus new type escapes, written to `<findings_dir>/prr-ts-static-checks.json`.

---

## Phase 1: Install and Discover Config

### Entry Criteria
- At least one changed file ends in `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` or `.cjs`.

### Actions
1. Install exactly what the lockfile pins: `npm ci` (package-lock.json), `pnpm install --frozen-lockfile` (pnpm-lock.yaml), or `yarn install --immutable` (Yarn 2+) / `yarn install --frozen-lockfile` (Yarn 1). Never run plain `npm install`; it can rewrite the lockfile.
2. List TypeScript projects: every `tsconfig*.json` referenced by CI, or the root `tsconfig.json` and its `references` array. Note whether `strict` is true.
3. Find the ESLint config: `eslint.config.js`/`.mjs`/`.ts` (flat config, ESLint 9 default) or `.eslintrc.*` (legacy). Copy the CI lint command.
4. Confirm promise rules are active for a changed file:
   `npx eslint --print-config <changed-file.ts> | grep -E 'no-floating-promises|no-misused-promises|require-await'`
   These typescript-eslint rules need type information (`parserOptions.project` or `parserOptions.projectService`). If they are absent, note "promise rules not enabled" for `prr-concurrency-pass`; do not enable them yourself.

### Output
Install command, tsconfig list, lint command, promise-rule status.

### Quality Gate
- The install command exited 0 and `git status --porcelain` shows no lockfile change.
- The promise-rule status is recorded as enabled or not enabled with the `--print-config` output.

---

## Phase 2: Run on Head and Base, Keep Only New Diagnostics

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Type check each project. `tsc` cannot type check a single file with project settings, so run the whole project:
   `npx tsc --noEmit -p tsconfig.json` (for project references use `npx tsc -b --noEmit` only if the TypeScript version supports it, check `npx tsc --help`; otherwise run per project).
   Output lines look like `src/cart.ts(42,7): error TS2322: Type 'string' is not assignable to type 'number'.`
2. Lint changed files with JSON output: `npx eslint --format json <changed files> > eslint-head.json`. Each result has `filePath` and `messages[]` with `ruleId`, `line`, `severity` (2 = error, 1 = warning).
3. Repeat both in a base worktree at the merge base (`git worktree add ../prr-base $(git merge-base origin/<base_branch> HEAD)`, then install there).
4. Keep a diagnostic if it is on a changed line (from `git diff -U0` hunk headers), or if it is a `TS` error in an unchanged file that appears on head but not on base (the PR broke a consumer).
5. Remove the base worktree afterward.

### Output
New-diagnostic list.

### Quality Gate
- `tsc` exit codes for head and base are recorded.
- Each kept diagnostic has file, line, code or rule ID, and is on a changed line or is a new consumer error.

---

## Phase 3: Audit Type Escapes

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. List added escapes:
   `git diff -U0 origin/<base_branch>...HEAD -- '*.ts' '*.tsx' | grep -nE '^\+.*(@ts-ignore|@ts-expect-error|@ts-nocheck|: any\b|as any\b|<any>|as unknown as|eslint-disable|[A-Za-z0-9_)\]]!\.)'`
2. Apply this table:

| Added text | Why it matters | Label |
|---|---|---|
| `@ts-nocheck` | Disables checking for the whole file | blocking |
| `@ts-ignore` | Hides the error forever, even after it is fixed | suggestion: use `@ts-expect-error` with a reason, which fails when no longer needed |
| `as unknown as T` | Double cast bypasses all compatibility checks | question: ask for a type guard |
| `any` in an exported signature | Spreads unchecked types to callers | suggestion: `unknown` plus narrowing |
| `x!.y` non-null assertion on data from I/O | Runtime `TypeError` when the value is missing | blocking if the value comes from a request, DB or API response; else nit |
| `eslint-disable` without a rule name | Disables every rule | suggestion: name the rule and give a reason |

3. Label diagnostics: `tsc` errors are blocking; ESLint severity 2 is blocking if CI fails on lint errors, else suggestion; severity 1 is nit.
4. Write `<findings_dir>/prr-ts-static-checks.json` (fields `flow`, `category`="static", `file`, `line`, `evidence`, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`ts_static_findings`.

### Quality Gate
- Every finding quotes a verbatim tool line or diff line.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Changed `src/orders/service.ts`.

- Phase 1: `npm ci` exit 0; flat config; `--print-config` shows `"@typescript-eslint/no-floating-promises": ["error"]`.
- Phase 2: head `npx tsc --noEmit -p tsconfig.json` prints `src/api/handler.ts(18,23): error TS2345: Argument of type 'OrderId | undefined' is not assignable to parameter of type 'OrderId'.`; base has no such error, and `handler.ts` was not changed: the PR changed `getOrder`'s return type. ESLint: `@typescript-eslint/no-floating-promises` at `service.ts:77` on a changed line.
- Phase 3: `+  const id = req.params.id!.trim()` is a non-null assertion on request data: blocking.
- Findings: TS2345 blocking, floating promise blocking, non-null assertion blocking.

---

## Exit Criteria

DONE when tsc and ESLint ran with the project's config on head and base, only PR-introduced diagnostics and escapes are reported with verbatim evidence, and the promise-rule status is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lockfile missing | **Adjust**: run `npm install --package-lock-only` in a scratch worktree only to resolve, and add a `question` finding asking why no lockfile is committed. |
| Phase 1 | Plain JavaScript project with no tsconfig | **Adjust**: skip `tsc`; run ESLint only. |
| Phase 2 | ESLint crashes with "parserOptions.project has been provided" errors for a file | **Adjust**: the file is not in any tsconfig `include`; record a `question` finding and lint the rest. |
| Phase 2 | Base install fails | **Adjust**: compare head output against changed lines only and record that base comparison was unavailable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
