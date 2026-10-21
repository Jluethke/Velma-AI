# npm Types and Package Lint

**One-line description:** Checks that every exported entry point resolves to the right types and module format under each TypeScript resolution mode with `@arethetypeswrong/cli` and `publint`, and fixes each named problem in `package.json` or the build config.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dual_build_config` (object, required): From `pkg-node-dual-esm-cjs`.
- `exports_map` (object, required): From `pkg-node-exports-map`.

---

## Outputs

- `types_report` (object): The attw resolution table per entry point and mode, publint messages, each problem's fix, and the final clean output of both tools.

---

## Phase 1: Run arethetypeswrong

### Entry Criteria
- `npm run build` exits 0.

### Actions
1. Run against a packed tarball (it builds one with `npm pack` internally): `npx @arethetypeswrong/cli --pack .`
2. Read the table: one column per entry point (`"<name>"`, `"<name>/errors"`), one row per resolution mode: `node10`, `node16 (from CJS)`, `node16 (from ESM)`, `bundler`. Each cell shows a format (`CJS`, `ESM`) with a check, or a problem.
3. Map each problem to its fix:

   | Problem shown | Meaning | Fix |
   |---|---|---|
   | Masquerading as CJS (FalseCJS) | a `.d.ts` file describes an ESM `.js`, but TypeScript reads the `.d.ts` as CJS | serve `.d.cts` for `require` and `.d.ts` for `import` in nested conditions |
   | Masquerading as ESM (FalseESM) | types say ESM, JavaScript is CJS | same nested types fix, opposite direction |
   | Resolution failed | a path in `exports` or `types` does not exist for that mode | correct the path; check the build output |
   | No types | the mode finds JavaScript but no declaration | add `types` in that condition branch |
   | Used fallback condition | resolution only worked through `default` | add an explicit condition |
   | CJS default export / Incorrect default export | `export default` compiled to CJS does not match how CJS callers import it | prefer named exports; check the attw docs page linked in the output |
   | node10 resolution failed on a subpath | Node 10 style resolution ignores `exports` | add `typesVersions` mapping or accept with `--profile node16` if node10 users are out of scope |

4. If the user does not support TypeScript's `node10` mode, rerun with `--profile node16` and record the choice. Do not pick this profile to hide failures the user needs.

### Output
attw problem list.

### Quality Gate
- The full attw table is pasted.
- Every non-green cell is mapped to a fix row.

---

## Phase 2: Run publint

### Entry Criteria
- Phase 1 ran.

### Actions
1. Run `npx publint`. Check `npx publint --help` for the strictness option in your version.
2. Read each message. Common ones: a file referenced in `exports` is not included in the published files, the `exports` `types` condition is not first, `"module"` field used without `exports`, a `.js` file interpreted with the wrong format given `"type"`.
3. Record each as a finding with its fix.

### Output
publint findings.

### Quality Gate
- publint output is pasted in full.

---

## Phase 3: Fix and Rerun

### Entry Criteria
- Findings from Phases 1 and 2.

### Actions
1. Apply fixes one at a time, in `package.json` or the build config only. Do not edit files under `dist/` by hand; rebuild instead.
2. After each fix: `npm run build && npx @arethetypeswrong/cli --pack . && npx publint`.
3. Stop when attw shows every cell green (or only cells excluded by a recorded profile choice) and publint prints no errors or warnings.
4. Add both commands to CI as a `lint:package` script: `"lint:package": "attw --pack . && publint"` with both tools in `devDependencies`.

### Output
`types_report`.

### Quality Gate
- Final attw run ends with no problems reported for in-scope modes.
- Final publint run reports no errors.

---

## Worked Example

Illustrative. `@acme/qs-lite`, before the nested types fix.

Phase 1:
```
$ npx @arethetypeswrong/cli --pack .
"@acme/qs-lite"
node10:             🟢 (CJS)
node16 (from CJS):  🎭 Masquerading as CJS
node16 (from ESM):  🟢 (ESM)
bundler:            🟢
```
Cause: one `"types": "./dist/index.d.ts"` serves both branches while `"type": "module"` makes it ESM.

Phase 3: change `exports["."]` to nested `import` and `require` objects with `.d.ts` and `.d.cts`. Rerun: all four modes green; `npx publint` prints `All good!`.

---

## Exit Criteria

DONE when attw shows correct types and formats for every entry point in every in-scope mode and publint reports no errors, with both checks wired into a script.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | attw cannot pack (prepack fails) | **Adjust**: fix `npm run build` first. |
| Phase 1 | Problem not in the table | **Adjust**: open the docs link attw prints for that problem and apply its fix. |
| Phase 3 | Fix for one mode breaks another | **Retry**: revert that one change, use nested conditions per format, rerun all modes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
