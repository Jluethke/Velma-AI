# Prove Each Node or TypeScript API Exists in the Installed Version

**One-line description:** Checks every external JavaScript or TypeScript name in the edit plan against the package versions in `node_modules`, their `.d.ts` type declarations, the package `exports` map, and the Node version actually installed, so no invented export, option key or runtime-only global reaches the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_api_evidence` (object[]): `[{ "symbol": str, "status": "FOUND"|"NOT_FOUND"|"WRONG_SIGNATURE"|"VERSION_GATED"|"WRONG_RUNTIME", "package": str, "installed_version": str, "evidence": str, "command": str }]`.

---

## Phase 1: Resolve Package and Version

### Entry Criteria
- `edit_plan` lists at least one external symbol.

### Actions
1. Run `node --version`. Read `engines.node` from `package.json` if present; that is the minimum your code must support.
2. Classify each symbol:

| Symbol looks like | Source of truth |
|---|---|
| `fs.readFile`, `node:crypto`, `URL`, `fetch` | Node built-in; check the Node docs for the installed major (nodejs.org/docs/latest-v<major>.x/api/) |
| `Intl.NumberFormat`, `Array.prototype.at`, `structuredClone` | JavaScript language or web API; check MDN's compatibility table for "Node.js" |
| `lodash.debounce`, `zod.string`, `express.Router` | the npm package in `node_modules/` |
| `document`, `window`, `localStorage` | browser only; status `WRONG_RUNTIME` for code that runs in Node (tests under jsdom are the exception: check `testEnvironment` in jest config or `environment` in vitest config) |

3. Installed package version: `npm ls <pkg> --depth=0` (pnpm: `pnpm ls <pkg>`; yarn: `yarn why <pkg>`). If that prints `(empty)` or `missing`, read `node_modules/<pkg>/package.json` directly; if the file is absent, status `NOT_FOUND`.
4. Do not use `npm view <pkg>`; it shows the registry's latest version, not the installed one.

### Output
Classification and version per symbol.

### Quality Gate
- Every package symbol has an installed version read from `npm ls` output or `node_modules/<pkg>/package.json`.

---

## Phase 2: Check the Export and Its Signature

### Entry Criteria
- Phase 1 done.

### Actions
1. Type declarations: find the package's types entry: `node -p "const p=require('./node_modules/<pkg>/package.json'); p.types || p.typings || JSON.stringify(p.exports, null, 1)"`. If no types ship with the package, look in `node_modules/@types/<pkg>/`.
2. Search the declaration: `rg -n "export (declare )?(function|const|class|interface|type|enum) NAME\b|NAME\s*[(<:]" node_modules/<pkg> -g "*.d.ts" -g "*.d.mts" -g "*.d.cts"`. Read the matched declaration fully, including every parameter and the options interface it takes.
3. For each option key or property your `new_text` uses (for example `{ currency: "USD", minimumFractionDigits: 2 }`), find it in the interface: `rg -n "minimumFractionDigits" node_modules/typescript/lib/lib.es*.intl.d.ts` for built-ins, or the package's `.d.ts` for libraries. Missing key: `WRONG_SIGNATURE`.
4. Runtime export check (catches `exports` maps that hide subpaths):
   - CommonJS: `node -e "const m=require('<pkg>'); console.log(typeof m.NAME)"`
   - ESM: `node --input-type=module -e "import * as m from '<pkg>'; console.log(typeof m.NAME, Object.keys(m).length)"`
   - Expect `function`, `object` or the right type. `undefined` means not exported from that entry point. `ERR_PACKAGE_PATH_NOT_EXPORTED` means the subpath import you planned (`'<pkg>/lib/x'`) is blocked by the `exports` field.
5. Default versus named export: if `typeof m.default.NAME` works but `typeof m.NAME` is `undefined`, your import must use the default export. Record which.
6. Version gate: for Node built-ins, the docs show "Added in: vX.Y.Z" under each API. Compare with `engines.node` (or the CI Node version). For language features, compare MDN's Node.js column.

### Output
Status and evidence per symbol.

### Quality Gate
- Each `FOUND` row quotes a `.d.ts` line or a `typeof` output in `evidence`.
- Each option key used in `new_text` is quoted from a declaration.

---

## Phase 3: Report

### Entry Criteria
- All symbols checked.

### Actions
1. Emit `node_api_evidence`.
2. For non-`FOUND` rows, name a verified alternative only if you checked it the same way.
3. Never assume a symbol exists because another version of the package has it. The declaration file under `node_modules` is the version you ship against.

### Output
`node_api_evidence`.

### Quality Gate
- Row count equals the number of distinct external symbols across `edit_plan`.

---

## Worked Example

Illustrative only.

Plan symbol: `Intl.NumberFormat` with options `style`, `currency`, `minimumFractionDigits`; repo `/work/shopfmt`, `engines.node` `>=18`.

```
$ node --version
v20.15.0
$ rg -n "minimumFractionDigits" node_modules/typescript/lib/lib.es5.d.ts
4497:        minimumFractionDigits?: number | undefined;
$ node -e "console.log(new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(0))"
$0.00
```

Row: `Intl.NumberFormat`, `FOUND`, built-in, evidence quotes the declaration line and the runtime output `$0.00`. A planned `Number.prototype.toCurrency` would return `undefined` from `node -e "console.log(typeof Number.prototype.toCurrency)"` and be `NOT_FOUND`.

---

## Exit Criteria

DONE when every external JS or TS symbol has a status backed by a declaration line or a runtime `typeof` output for the installed version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package absent from `node_modules` | **Return**: `NOT_FOUND`; adding a dependency is out of scope. |
| Phase 2 | Package ships no types and no `@types` | **Adjust**: use the runtime `typeof` check and the package README for the installed version tag. |
| Phase 2 | `ERR_REQUIRE_ESM` on the CommonJS check | **Retry**: use the ESM form of the check. |
| Phase 2 | Symbol exists only in a newer major | **Return**: `VERSION_GATED` with both versions quoted. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
