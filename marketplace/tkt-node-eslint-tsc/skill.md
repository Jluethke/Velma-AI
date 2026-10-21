# TypeScript and JavaScript Lint, Format and Type Check (eslint, prettier, tsc)

**One-line description:** Runs ESLint (flat or legacy config), Prettier and `tsc --noEmit` exactly as CI does, separates findings on changed lines from pre-existing ones, and fixes only introduced findings without `eslint-disable`, `@ts-ignore` or config edits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_diff` (string, required): Output of `tkt-small-edit-loop`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `node_static_report` (object): Tools and versions, commands, findings split into `introduced` and `pre-existing`, suppressions added with reasons, final exit codes.

---

## Phase 1: Identify the Tool Set

### Entry Criteria
- Dependencies installed by `tkt-node-env-baseline`.

### Actions
1. Read `scripts` in `package.json` for `lint`, `format`, `format:check`, `typecheck`, and CI's calls to them.
2. Map config to tool:

| Config present | Tool | CI-equivalent command |
|---|---|---|
| `eslint.config.js`, `.mjs`, `.cjs` or `.ts` | ESLint flat config (default from ESLint 9) | `npx eslint .` |
| `.eslintrc.*` or `eslintConfig` in `package.json` | ESLint legacy config | `npx eslint . --ext .ts,.tsx,.js` (the `--ext` flag works only with legacy config) |
| `.prettierrc*`, `prettier.config.*`, `prettier` key in `package.json` | Prettier | `npx prettier --check .` |
| `biome.json` or `biome.jsonc` | Biome | `npx biome check .` |
| `tsconfig.json` | tsc | `npx tsc --noEmit -p tsconfig.json`; with project references (`"references"` key) use `npx tsc -b` |

3. Record versions: `npx eslint --version`, `npx prettier --version`, `npx tsc --version`. Always run through `npx`, `pnpm exec` or `yarn` so the project's pinned version runs.
4. Note if CI passes `--max-warnings 0` to ESLint; then warnings fail the build too.
5. List changed files: `git diff --name-only --diff-filter=d <base>...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs'`.

### Output
Tool list, commands and changed files.

### Quality Gate
- Each tool is backed by a config file or CI line.
- Versions recorded from the project-local binaries.

---

## Phase 2: Run and Split Findings

### Entry Criteria
- Tool list ready.

### Actions
1. Run each CI command. Read outputs:
   - ESLint (stylish formatter): a file path line, then `  44:7  error  'opts' is assigned a value but never used  @typescript-eslint/no-unused-vars`, ending with `✖ 3 problems (2 errors, 1 warning)`.
   - tsc: `src/export/csv.ts:44:7 - error TS2345: Argument of type 'string[]' is not assignable to parameter of type 'readonly Column[]'.` and a final `Found 1 error in src/export/csv.ts:44`. The `TSxxxx` code identifies the error class.
   - Prettier `--check`: `[warn] src/export/csv.ts` then `[warn] Code style issues found in the above file. Run Prettier with --write to fix.`
2. Split each finding against `git diff -U0 <base>...HEAD`: on an added or changed line = `introduced`; else `pre-existing`. For tsc, an error in an unchanged file can still be introduced by your change (you changed a type it uses). If the error's file is unchanged, check whether it appears in the baseline typecheck count from `node_baseline_report`; if it does not, it is introduced.
3. Explain unfamiliar rules from the rule id: ESLint core rules at eslint.org/docs/latest/rules/<rule>, typescript-eslint rules at typescript-eslint.io/rules/<rule>.

### Output
Classified findings per tool.

### Quality Gate
- Every finding is classified with file:line:col.
- tsc error count compared to the baseline count is recorded.

---

## Phase 3: Fix Introduced Findings

### Entry Criteria
- Findings split.

### Actions
1. Format changed files only: `npx prettier --write <changed files>`.
2. Autofix lint on changed files: `npx eslint --fix <changed files>`. Review the diff after; autofix can reorder imports or change quotes, which is fine, but check it did not touch logic.
3. Fix tsc errors in the code, one file at a time, rerunning `npx tsc --noEmit` after each. Preference: correct the type; narrow with `typeof`, `in`, or a type guard; use `satisfies` to check a literal without widening. Avoid `as` casts that hide the problem; never use `as any` or `as unknown as T` to silence an error.
4. Suppressions only when unavoidable and specific: `// eslint-disable-next-line <rule-id> -- <reason>` (never a bare disable or a file-wide `/* eslint-disable */`); `// @ts-expect-error <reason>` instead of `// @ts-ignore`, because `@ts-expect-error` itself errors when the underlying error goes away. Record each suppression.
5. Do not edit `eslint.config.*`, `.eslintrc*`, `tsconfig*.json` (for example turning off `strict` or adding `skipLibCheck`), or `.prettierignore` to make checks pass.
6. Rerun all CI commands and the tests for touched files.

### Output
`node_static_report`.

### Quality Gate
- All CI static commands exit 0, or remaining findings are all `pre-existing` and listed.
- `git diff <base>...HEAD | rg -n '^\+.*(@ts-ignore|as any\b|eslint-disable(?!-next-line \S+ -- ))' --pcre2` prints nothing.
- No changes to lint, format or tsconfig files unless the ticket asked for them (`git diff --name-only <base>...HEAD`).

---

## Worked Example

Illustrative only.

```
$ pnpm exec eslint . --max-warnings 0
/work/web/src/export/csv.ts
  44:7  error  'opts' is assigned a value but never used  @typescript-eslint/no-unused-vars
✖ 1 problem (1 error, 0 warnings)
$ pnpm exec tsc --noEmit
src/export/csv.ts:51:20 - error TS2345: Argument of type 'string[]' is not assignable to parameter of type 'readonly Column[]'.
Found 1 error in src/export/csv.ts:51
```

Both lines are in the diff (introduced). Fix: delete the unused `opts`; type the array as `const columns: Column[] = ["id", "amount", "currency"]` because `Column` is a string-literal union defined in `src/export/types.ts`. Rerun:

```
$ pnpm exec eslint . --max-warnings 0 && pnpm exec tsc --noEmit && pnpm exec prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

Report: 2 introduced fixed, 0 suppressions.

---

## Exit Criteria

DONE when ESLint, Prettier (or Biome) and tsc pass in their CI form or fail only on listed pre-existing findings, with no blanket suppressions, `any` casts, or config edits added.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ESLint errors "couldn't find an eslint.config" with ESLint 9 and a legacy config | **Adjust**: use the exact script CI runs (it may set `ESLINT_USE_FLAT_CONFIG=false`); do not migrate the config in this ticket. |
| Phase 2 | tsc reports errors inside `node_modules` | **Adjust**: compare with the baseline; if pre-existing, list them; do not add `skipLibCheck`. |
| Phase 2 | Monorepo with per-package configs | **Adjust**: run each tool from the package directory CI uses (`working-directory:`), or with `pnpm -r` / `--filter` as CI does. |
| Phase 3 | Autofix touched files outside the change | **Retry**: `git restore` those files and rerun autofix on changed files only. |
| Phase 3 | Type error requires changing a shared type used widely | **Return**: add a step to `edit_plan` for the shared type and run it through `tkt-small-edit-loop`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
