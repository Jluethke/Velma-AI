# TypeScript ESLint Error and Promise Rules Gate

**One-line description:** Enables type-aware typescript-eslint rules that catch floating promises, misused promises, thrown non-Errors, non-Error rejections and `any` catch callback variables, plus ESLint core `no-empty` for catch blocks, fixes or annotates every hit with a reason, and fails CI on regressions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Package root.
- `ts_failure_tests` (object, required): From `errh-ts-failure-path-tests`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.

---

## Outputs

- `ts_lint_gate` (object): `{ eslint_version, typescript_eslint_version, config_file, rules, disable_comments: [ { file, line, rule, reason } ], ci_step }`.

---

## Phase 1: Check Versions and Rules

### Entry Criteria
- `npx eslint --version` and `npm ls typescript-eslint @typescript-eslint/eslint-plugin` recorded.

### Actions
1. Config style: ESLint 9 uses flat config (`eslint.config.mjs`); ESLint 8 uses `.eslintrc.*`. Write the config for the installed major.
2. Rules and what they find (confirm each on typescript-eslint.io for your version):

| Rule | Finds | Needs type info |
|---|---|---|
| `@typescript-eslint/no-floating-promises` | promise not awaited, returned or `.catch`ed | yes |
| `@typescript-eslint/no-misused-promises` | async function passed where a void callback is expected (for example an `async` Express 4 handler or `addEventListener`) | yes |
| `@typescript-eslint/only-throw-error` | `throw "text"` or non-Error objects (replaced `no-throw-literal`) | yes |
| `@typescript-eslint/prefer-promise-reject-errors` | `Promise.reject("text")` | yes |
| `@typescript-eslint/use-unknown-in-catch-callback-variable` | `.catch((e) => ...)` where `e` is `any` | yes |
| `no-empty` (core) | empty blocks including `catch {}` unless `allowEmptyCatch` is set | no |

3. ESLint core also has `preserve-caught-error` in recent 9.x releases (requires `cause` when rethrowing a new error in a catch). Enable it only if `npx eslint --print-config src/index.ts | rg preserve-caught-error` or the ESLint rules docs confirm your version has it.

### Output
Rule list confirmed for installed versions.

### Quality Gate
- Every rule enabled later is confirmed to exist in the installed version (an unknown rule makes ESLint fail with "Could not find ... in plugin").

---

## Phase 2: Configure and Run

### Entry Criteria
- Rules confirmed.

### Actions
1. Flat config (`eslint.config.mjs`):
```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/prefer-promise-reject-errors": "error",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },
);
```
   `import.meta.dirname` needs Node 20.11+; otherwise use `path.dirname(fileURLToPath(import.meta.url))`. If the repo already uses `parserOptions.project`, keep it.
2. Run `npx eslint . --max-warnings 0` and save output. Count per rule: `npx eslint . -f json | jq -r '.[].messages[].ruleId' | sort | uniq -c`.

### Output
Findings per rule.

### Quality Gate
- ESLint runs without "parserOptions.project" or "projectService" configuration errors.
- Per-rule counts recorded.

---

## Phase 3: Fix, Annotate, Enforce

### Entry Criteria
- Findings saved.

### Actions
1. Fix with the idiom table in `errh-ts-result-and-error-cause`, one file at a time; run tests after each.
   - floating promise: `await` it, `return` it, or `.catch(routeToBoundaryLogger)`. `void` is accepted by the rule (`ignoreVoid` defaults to true) but still needs a `.catch`.
   - misused promise in Express 4 handler: wrap with the async handler wrapper from `errh-ts-express-problem-details`.
2. For `keep_boundary`/`keep_documented` triage rows only: `// eslint-disable-next-line no-empty -- contract: missing cache entry is a miss`. The ` -- ` reason syntax is supported since ESLint 7; enable `reportUnusedDisableDirectives` (`linterOptions.reportUnusedDisableDirectives: "error"` in flat config) so stale disables fail.
3. Do NOT add file-level `/* eslint-disable */`. Do NOT set rules to `"warn"` to get green.
4. CI: `npx eslint . --max-warnings 0`.
5. Prove it is live: add `fetch("https://example.com");` (no await) to a source file, run ESLint, confirm `no-floating-promises` and non-zero exit, then `git checkout -- <file>`.

### Output
`ts_lint_gate`.

### Quality Gate
- ESLint exits 0 on the clean tree and 1 with the planted floating promise.
- `rg -n "eslint-disable" src` count equals the recorded disables, each with ` -- ` and a reason.
- The test command recorded by `errh-boundary-map` passes.

---

## Worked Example

Illustrative.
```
$ npx eslint . --max-warnings 0
src/jobs/sync.ts
  14:3  error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
src/cache.ts
  31:13 error  Empty block statement  no-empty
```
Fix: `await pushChanges(batch);` in `sync.ts`; `cache.ts:31` is a `keep_documented` row, so it gets a disable comment with the contract reason.

---

## Exit Criteria

DONE when the type-aware promise and throw rules and `no-empty` pass, each disable has a reason tied to a triage row, unused disables fail, and CI fails on a planted floating promise.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | typescript-eslint older than the rule | **Adjust**: upgrade typescript-eslint or drop the rule and record; do not substitute a guessed name. |
| Phase 2 | "file not included in project" errors | **Adjust**: include the file in `tsconfig.json` or a `tsconfig.eslint.json`, or use `projectService.allowDefaultProject` for config files. |
| Phase 3 | Hundreds of floating promises in one area | **Adjust**: fix per file over several runs; keep the rule at error. |
| Phase 3 | Fix breaks tests | **Retry**: revert the file and redo; never delete tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
