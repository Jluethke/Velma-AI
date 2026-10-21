# TypeScript Declaration Files and @types

**One-line description:** Resolves every TS7016 "could not find a declaration file" error and every untyped global or module augmentation by checking for bundled types, installing a version-matched `@types` package from DefinitelyTyped, or writing a minimal typed `.d.ts`, and never by a bare `declare module` shorthand that turns the whole library into `any`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `ts_allowjs_config` (object, required): From `tsm-ts-allowjs-checkjs`; confirms the tsconfig exists and records module settings.

---

## Outputs

- `ts_declarations` (object[]): One row per dependency or global: `name`, `installed_version`, `resolution` (`bundled`, `@types`, `local-dts`, `augmentation`), the `@types` version or `.d.ts` path, and the TS7016 count before and after.

---

## Phase 1: List the Untyped Imports

### Entry Criteria
- `tsconfig.json` exists and `npm run typecheck` runs.

### Actions
1. TS7016 is reported only when `noImplicitAny` is on. Probe with a throwaway config `tsconfig.dts-probe.json`: `{ "extends": "./tsconfig.json", "compilerOptions": { "noImplicitAny": true, "checkJs": true } }`.
2. Run `npx tsc -p tsconfig.dts-probe.json --pretty false | grep "TS7016" > .typecheck-logs/ts7016.txt`. Lines read `src/a.ts(3,22): error TS7016: Could not find a declaration file for module 'left-pad'. '/repo/node_modules/left-pad/index.js' implicitly has an 'any' type.`
3. Extract unique module names: `grep -o "module '[^']*'" .typecheck-logs/ts7016.txt | sort -u`.
4. Delete the probe config.

### Output
List of untyped modules.

### Quality Gate
- The probe config is deleted and `git status --porcelain` shows no tracked change.
- Each module name in the list appears in `package.json` dependencies or is a relative path (relative paths are your own JavaScript files, handled by conversion, not here).

---

## Phase 2: Resolve Each Module in Order of Preference

### Entry Criteria
- Phase 1 list exists.

### Actions
For each module, apply the first row that works, one module per commit:

| Step | Check | Action if true |
|---|---|---|
| 1 | Installed package ships types: `node -p "const p=require('./node_modules/<name>/package.json');JSON.stringify([p.types,p.typings,p.exports])"` shows a `.d.ts` or a `types` condition | The error is a resolution problem, not a missing type. Check `moduleResolution`; `node10` cannot read `exports`. Record `bundled`. |
| 2 | Newer major of the package ships types: `npm view <name> types typings` | **Return** to the user: upgrading is a dependency change outside this flow. |
| 3 | DefinitelyTyped has it: `npm view @types/<name> versions --json` (scoped package `@scope/pkg` becomes `@types/scope__pkg`) | Install the `@types` version whose major and minor match the installed library: `npm install --save-dev --save-exact @types/<name>@<major>.<minor>`. Record `@types`. |
| 4 | None of the above | Write a local declaration (below). Record `local-dts`. |

Rules that apply to every row:
1. `@types/node` major must match the Node major in `.nvmrc` or `engines.node`. `@types/react` and `@types/react-dom` major must match `react`.
2. Put `@types/*` in `devDependencies` unless the package publishes declarations that re-export those types (a library you publish); then they belong in `dependencies`.
3. Do not add `typeRoots` unless needed. Setting `typeRoots` replaces the default `node_modules/@types` lookup, so list `"./node_modules/@types"` in it if you do. Setting `"types": [...]` limits which global `@types` packages load; a missing entry there causes errors like `Cannot find name 'describe'`.

Writing a local declaration (row 4):
1. Create `src/types/<name>.d.ts` (inside `include`). Declare only what the code uses. Find the used surface with `grep -rn "from '<name>'" src` and `grep -rn "require('<name>')" src`.
   ```ts
   declare module "left-pad" {
     function leftPad(str: string | number, len: number, ch?: string | number): string;
     export = leftPad;
   }
   ```
   Use `export =` for a CommonJS `module.exports =` library and `export default` only when the library really has a `default` export. Check the library source in `node_modules/<name>` to see which.
2. Never write `declare module "left-pad";` alone. That shorthand makes every import `any` and hides the problem from type coverage.
3. A starting draft can come from `npx dts-gen -m <name>` (Microsoft dts-gen); treat its output as a draft and delete every member the code does not use.

Module augmentation (adding fields to a library's types, for example `req.user` in Express):
1. Create `src/types/express.d.ts`:
   ```ts
   import "express-serve-static-core";
   declare module "express-serve-static-core" {
     interface Request { user?: { id: string; roles: string[] } }
   }
   ```
   The top-level `import` makes the file a module so the block augments instead of replacing. Global additions use `declare global { interface Window { appConfig: AppConfig } }` inside a file with `export {}`.

### Output
`ts_declarations`.

### Quality Gate
- Rerunning the Phase 1 probe prints zero TS7016 lines for every module marked resolved.
- `grep -rn "declare module \"[^\"]*\";" src` and the same with single quotes return nothing.
- `npm ls @types/<name>` shows one version for each installed types package, and its major matches the library (compare with `npm ls <name>`).

---

## Worked Example

Illustrative only. Phase 1 finds `left-pad`, `@acme/geo`, `express` (augmentation needed for `req.user`).

Phase 2:
```
$ node -p "const p=require('./node_modules/left-pad/package.json');JSON.stringify([p.types,p.typings,p.exports])"
[null,null,null]
$ npm view @types/left-pad versions --json
[ "1.1.0", "1.2.0" ]
$ npm ls left-pad
└── left-pad@1.3.0
```
`@types/left-pad@1.2.0` is the closest published minor; check its header comment for the covered version, install exact. `@acme/geo` is a private package with no types: write `src/types/acme__geo.d.ts` declaring the two functions the code imports. `express` gets the augmentation file. Probe rerun: 0 TS7016 lines.

---

## Exit Criteria

DONE when every untyped module is resolved by bundled types, a version-matched `@types` package, or a typed local declaration, and no shorthand ambient module exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `@types` package exists but its major differs from the library | **Adjust**: write a local declaration for the used surface instead of installing mismatched types. |
| Phase 2 | Duplicate identifier errors after installing `@types` | **Adjust**: the library already bundles types; uninstall the `@types` package. |
| Phase 2 | Augmentation has no effect | **Retry**: the `.d.ts` is outside `include` or lacks a top-level import or `export {}`; fix and rerun. |
| Phase 2 | Library surface is too large to declare by hand | **Return**: ask the user whether to declare only the imported members, which is the default. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
