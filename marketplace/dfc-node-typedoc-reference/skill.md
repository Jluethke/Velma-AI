# TypeScript API Reference With TypeDoc

**One-line description:** Generates a TypeScript package's API reference with TypeDoc from the same entry points listed in `package.json` `exports`, turns on TypeDoc's validation for unexported referenced types, broken `{@link}` targets and undocumented exports, and builds with `treatWarningsAsErrors` until it exits 0.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the package root.
- `docstring_report` (object[], required): Result of `dfc-node-tsdoc-conventions`; must show zero remaining missing comments.

---

## Outputs

- `api_reference_dir` (string): Output directory of the reference (HTML in `docs/api`, or Markdown in a docs site folder when the Markdown plugin is used).
- `api_build_log` (object[]): TypeDoc warnings by category before and after, with the fix applied to each category.

---

## Phase 1: Configure TypeDoc

### Entry Criteria
- `docstring_report` shows zero remaining missing comments.
- `npx tsc --noEmit` exits 0 (TypeDoc runs the TypeScript compiler and fails on type errors).

### Actions
1. Install: `npm install --save-dev typedoc`. Check compatibility: TypeDoc releases support a stated range of TypeScript versions; compare `npx tsc --version` with the TypeDoc release notes before proceeding.
2. Pick output format:

   | Docs site | Output |
   |---|---|
   | None, or a separate static HTML reference | TypeDoc default HTML theme |
   | Docusaurus or MkDocs site that should host the reference as pages | Add `typedoc-plugin-markdown` (`npm install --save-dev typedoc-plugin-markdown`) and set `"plugin": ["typedoc-plugin-markdown"]` |

3. Create `typedoc.json` at the package root. Entry points are the source files behind `package.json` `exports`, not every file:
   ```json
   {
     "$schema": "https://typedoc.org/schema.json",
     "entryPoints": ["src/index.ts"],
     "out": "docs/api",
     "excludePrivate": true,
     "excludeInternal": true,
     "treatWarningsAsErrors": true,
     "validation": {
       "notExported": true,
       "invalidLink": true,
       "notDocumented": true
     }
   }
   ```
4. For a monorepo with several packages, set `"entryPointStrategy": "packages"` and list package directories as `entryPoints`; each package then needs its own `typedoc.json`.
5. Do NOT set `"entryPoints": ["src/**/*.ts"]`; that documents internal modules as public API.

### Output
`typedoc.json`.

### Quality Gate
- `npx typedoc --showConfig` prints the merged options including `"treatWarningsAsErrors": true`.

---

## Phase 2: Build and Fix Warnings

### Entry Criteria
- Configuration valid.

### Actions
1. Build: `npx typedoc 2>&1 | tee /tmp/typedoc.log`.
2. Fix by message with this table:

   | Message contains | Cause | Fix |
   |---|---|---|
   | `is referenced by ... but not included in the documentation` | An exported API uses a type that is not exported | Export the type from the entry point if users need it; if it is internal by design, add its name to `"intentionallyNotExported"` in `typedoc.json` and record the decision |
   | `Failed to resolve link to` | `{@link Name}` target does not exist or is not exported | Correct the name; use declaration references such as `{@link Limiter.wait}` |
   | `does not have any documentation` | `notDocumented` found an export with no comment | Return to `dfc-node-tsdoc-conventions` for that symbol |
   | `Unknown block tag` | Tag not defined for TypeDoc | Remove the tag, or add it to `blockTags` in `typedoc.json` with the tag defined in `tsdoc.json` |
   | TypeScript compile error | Type error in source | Fix with `npx tsc --noEmit` output; TypeDoc does not run past it |

3. Fix one message type per rebuild.
4. Do NOT set `treatWarningsAsErrors` to `false` or remove a `validation` key to get a clean build. Exporting a type only to silence a warning changes the public API; ask the user before exporting anything new.

### Output
`api_build_log`; reference in `out`.

### Quality Gate
- `npx typedoc; echo $?` prints `0` last.
- `ls docs/api/index.html` (HTML) or `ls docs/api/README.md` (Markdown plugin, file name per plugin version) succeeds.

---

## Phase 3: Wire the Reference Into the Docs

### Entry Criteria
- Clean build.

### Actions
1. Add the output directory to `.gitignore` when the reference is built in CI; commit it only if the hosting has no build step.
2. Add a script: `"docs:api": "typedoc"` in `package.json` `scripts`.
3. Link the reference from the README Documentation section and from the docs site navigation.

### Output
`api_reference_dir` recorded with its build script.

### Quality Gate
- `npm run docs:api` exits 0.
- `git check-ignore docs/api` prints `docs/api` when the reference is built in CI.

---

## Worked Example

Illustrative only. First build:
```
$ npx typedoc
[warning] RetryOptions, defined in ./src/retry.ts, is referenced by retry.options but not included in the documentation
[warning] Failed to resolve link to "Backoff" in comment for retry
[error] Found 0 errors and 2 warnings
```
Fixes: `RetryOptions` is a parameter type users must construct, so `export type { RetryOptions } from "./retry";` is added to `src/index.ts` (user approved); the comment link changes to `{@link BackoffStrategy}`, the real exported name. Rebuild:
```
$ npx typedoc
[info] html generated at ./docs/api
```

---

## Exit Criteria

DONE when TypeDoc builds the reference from the `exports` entry points with all three validations on and warnings treated as errors, exits 0, and is reachable through `npm run docs:api`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | TypeDoc rejects the installed TypeScript version | **Adjust**: install the TypeDoc version whose release notes list that TypeScript version. |
| Phase 1 | Package is JavaScript with JSDoc only | **Adjust**: TypeDoc needs `allowJs` in a `tsconfig` it reads; point `"tsconfig"` in `typedoc.json` at one with `allowJs: true`. |
| Phase 2 | Warning count does not drop after a fix | **Retry**: delete the `out` directory and rebuild; then compare messages line by line. |
| Phase 2 | User declines exporting a referenced type | **Adjust**: list it in `intentionallyNotExported`, recording the decision in `api_build_log`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
