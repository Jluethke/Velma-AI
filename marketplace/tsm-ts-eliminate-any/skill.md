# Eliminate any and Type Assertions in TypeScript

**One-line description:** Enables the typed typescript-eslint rules that find explicit `any`, unsafe `any` flows and assertions (`no-explicit-any`, the five `no-unsafe-*` rules, `no-unnecessary-type-assertion`, `no-non-null-assertion`, `consistent-type-assertions`, `ban-ts-comment`), then replaces each finding with `unknown` plus narrowing, a type guard, `satisfies`, or a generic.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_strict_result` (object, required): From `tsm-ts-strict-family-flags`; strict must be on, otherwise unsafe-rule results are incomplete.

---

## Outputs

- `ts_unsafe_fixes` (object): Lint finding counts per rule before and after, the committed ESLint config diff, the list of remaining findings with an inline disable comment and its reason, and the type-coverage number after (same command as `tsm-ts-type-coverage`).

---

## Phase 1: Turn On Typed Linting

### Entry Criteria
- tsc exits 0 with `strict: true`.

### Actions
1. Check the installed versions: `npm ls eslint typescript-eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`. This flow assumes ESLint 9 flat config (`eslint.config.js` or `.mjs`) with the `typescript-eslint` package (v8). If the repo uses `.eslintrc*`, use the same rule names under `rules` and `parserOptions.project`; check the typescript-eslint docs for that setup.
2. If missing, install pinned: `npm install --save-dev --save-exact eslint typescript-eslint`.
3. In `eslint.config.mjs`, enable type information and the rules:
   ```js
   import tseslint from "typescript-eslint";
   export default tseslint.config(
     ...tseslint.configs.recommendedTypeChecked,
     {
       languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
       rules: {
         "@typescript-eslint/no-explicit-any": "error",
         "@typescript-eslint/no-unsafe-assignment": "error",
         "@typescript-eslint/no-unsafe-member-access": "error",
         "@typescript-eslint/no-unsafe-call": "error",
         "@typescript-eslint/no-unsafe-return": "error",
         "@typescript-eslint/no-unsafe-argument": "error",
         "@typescript-eslint/no-unnecessary-type-assertion": "error",
         "@typescript-eslint/no-non-null-assertion": "error",
         "@typescript-eslint/consistent-type-assertions": ["error", { "assertionStyle": "as", "objectLiteralTypeAssertions": "never" }],
         "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true }]
       }
     }
   );
   ```
   `import.meta.dirname` needs Node 20.11 or newer; on older Node use `path.dirname(fileURLToPath(import.meta.url))`.
4. Run and save: `npx eslint "src/**/*.{ts,tsx}" -f json -o .typecheck-logs/eslint-any.json`. Count per rule: `node -e "const r=require('./.typecheck-logs/eslint-any.json');const c={};for(const f of r)for(const m of f.messages)c[m.ruleId]=(c[m.ruleId]||0)+1;console.log(c)"`.
5. Commit the config with the rules at `"warn"` first if the count is non-zero and main must stay green; they become `"error"` in Phase 3.

### Output
Typed lint running, findings counted per rule.

### Quality Gate
- `npx eslint --print-config src/index.ts | grep no-unsafe-assignment` shows the rule active.
- The JSON log exists and the per-rule counts are recorded.

---

## Phase 2: Replace Each Finding

### Entry Criteria
- Phase 1 findings recorded.

### Actions
1. Work one file per commit, starting with files that have the most `no-unsafe-*` findings (those spread `any` to other files).
2. Use this table. Pick the first row that matches:

   | Finding | Replacement |
   |---|---|
   | `x: any` on data whose shape you know | Write the type or interface. |
   | `any` on data from outside the program (`JSON.parse`, `res.json()`, `req.body`, `process.env`, `localStorage`) | Type as `unknown`; validation comes from `tsm-ts-zod-boundaries`. Mark `// TODO(tsm-ts-zod-boundaries)`. |
   | `any` because a function accepts many types | Generic: `function first<T>(xs: readonly T[]): T \| undefined`. |
   | `as Foo` on a value that has several possible shapes | Discriminated union plus `switch (v.kind)` with a `never` default: `const _exhaustive: never = v;`. |
   | `as Foo` after a runtime check the compiler cannot see | User-defined guard: `function isFoo(v: unknown): v is Foo { return typeof v === "object" && v !== null && "id" in v; }` or an assertion function `function assertFoo(v: unknown): asserts v is Foo`. |
   | `as const`-style object typed with `as Config` | `const config = { ... } satisfies Config;` keeps literal types and still checks the shape (TypeScript 4.9+). |
   | `x as unknown as Foo` | Banned. Find why the types disagree; fix the source type. |
   | `x!` | Narrow with a check, see `tsm-ts-strictnullchecks` Phase 3. |
   | `// @ts-ignore` | Remove; if the error is real and must stay, `// @ts-expect-error -- <reason>`. |
   | `Function` or `Object` type | Write the real signature `(a: A) => R` or `Record<string, unknown>`. |
   | Library returns `any` (for example an old `@types` package) | Wrap once: `const raw: unknown = lib.call(); ` then narrow; do not let `any` leave the wrapper. |

3. Guards must check every property the code later reads. A guard that checks only `"id" in v` but returns `v is User` lies to the compiler. Write a unit test for each guard with one valid and one invalid input.
4. When no replacement is possible (a genuinely dynamic API), keep the line with `// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- <reason>` and record it. Never disable a rule file-wide or in config.
5. After each file: `npx tsc --noEmit -p tsconfig.json`, `npx eslint <file>`, `test_command`. Commit `types(any): <file>`.

### Output
Findings replaced or individually justified.

### Quality Gate
- `npx eslint <file>` prints zero findings for the rules above, except lines with a reasoned `eslint-disable-next-line`.
- Each new type guard has a test: `grep -rn "<guardName>" test src --include=*.test.ts` finds it.
- `grep -rn "as unknown as" src` prints nothing.

---

## Phase 3: Lock It In

### Entry Criteria
- All files processed.

### Actions
1. Set every rule from Phase 1 to `"error"`. Run `npx eslint "src/**/*.{ts,tsx}" --max-warnings 0`; it must exit 0.
2. Count reasoned disables: `grep -rn "eslint-disable-next-line @typescript-eslint/no-" src | wc -l`. Record the list.
3. Re-run type coverage with the exact command from `tsm-ts-type-coverage` and record the new number.
4. Commit `types: enforce no-any rules`.

### Output
`ts_unsafe_fixes`.

### Quality Gate
- `npx eslint ... --max-warnings 0` exits 0.
- Type coverage percent is greater than or equal to the recorded `ts_type_coverage.percent`.

---

## Worked Example

Illustrative only. Phase 1 counts: `no-unsafe-member-access` 140, `no-unsafe-assignment` 96, `no-explicit-any` 41, `no-non-null-assertion` 18.

Phase 2, `src/lib/cache.ts`: `get(key: string): any` returns values stored by `set(key: string, value: any)`. Make the class generic: `class Cache<V> { get(key: string): V | undefined; set(key: string, value: V): void }`. Callers that did `cache.get(k).total` now see `V | undefined` and narrow. Lint for the file: 0. Tests pass. Commit.

`src/routes/orders.ts`: `const body = req.body as CreateOrder` becomes `const body: unknown = req.body; // TODO(tsm-ts-zod-boundaries)`, and the handler uses a guard until the boundary flow adds the schema.

Phase 3: `--max-warnings 0` exits 0, 3 reasoned disables remain (a plugin API that returns `any`), coverage rises from 91.84 to 97.10.

---

## Exit Criteria

DONE when the rules are at `error`, ESLint exits 0 with `--max-warnings 0`, every remaining disable is single-line with a reason, and type coverage did not drop.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Typed lint is very slow or reports "file not included in project" | **Adjust**: make sure the file is in the tsconfig `include`; with `projectService` add a `tsconfig.eslint.json` only if the docs for the installed version say so. |
| Phase 2 | A guard needs to check a deep object | **Adjust**: replace the hand-written guard with a zod schema from `tsm-ts-zod-boundaries`. |
| Phase 2 | Removing an assertion breaks many callers | **Retry**: fix the source type once instead of adding assertions at each caller. |
| Phase 3 | Someone proposes turning a rule off in config to reach zero | **Stop**: rules stay on; justify single lines instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
