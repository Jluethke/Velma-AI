# TypeScript Doc Samples Tested From Source Files and README Extraction

**One-line description:** Makes TypeScript and JavaScript doc samples executable by keeping site samples as real files under `examples/` that are type-checked and run as tests and imported into Docusaurus MDX with `raw-loader` and `CodeBlock`, and by extracting README fenced blocks with `codedown` so they are type-checked against the built package.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the package root.
- `readme_path` (string, required): README from `dfc-readme-structure`; its TypeScript blocks are extracted and checked.

---

## Outputs

- `sample_test_command` (string): The npm script CI runs to type-check and execute all samples (`npm run test:samples`).
- `sample_test_report` (object[]): Per sample: source (example file or README block), type check result, run result, failure class and fix.

---

## Phase 1: Move Site Samples Into Real Files

### Entry Criteria
- `npx tsc --version` prints a version; the package builds (`npm run build` exits 0).
- The docs site is Docusaurus with `.md`/`.mdx` pages, or there are no site pages (then do only Phase 2).

### Actions
1. List fenced TS/JS blocks in site pages: `git grep -n -E '^```(ts|tsx|typescript|js|javascript)' -- 'docs/**/*.md' 'docs/**/*.mdx'`.
2. For each block that shows usage of this package (not shell commands, not config snippets for other tools), create a file `examples/<page-slug>-<n>.ts` containing the block's code as a complete program: imports at the top, top-level `await` only if the `tsconfig` module setting allows it.
3. Import the package by its published name (`import { parseDuration } from "durationkit";`), never by relative path into `src/`. Add `"paths"` in `examples/tsconfig.json` or use a workspace link so the name resolves to the local build.
4. Replace the fenced block in the MDX page with an import of the file:
   ```mdx
   import CodeBlock from '@theme/CodeBlock';
   import QuickstartSource from '!!raw-loader!../examples/quickstart-1.ts';

   <CodeBlock language="ts" title="quickstart.ts">{QuickstartSource}</CodeBlock>
   ```
   Install the loader with `npm install --save-dev raw-loader`. `.md` files must be renamed `.mdx`, or have MDX format enabled, before they can use `import`.
5. Convert one page at a time and run `npm run build` in the site directory after each page.

### Output
Example files and MDX pages that import them.

### Quality Gate
- `git grep -c -E '^```(ts|typescript)' -- 'docs/**/*.mdx'` shows only blocks that are not package usage (record each remaining one and why).
- The site build exits 0.

---

## Phase 2: Extract README Blocks

### Entry Criteria
- `readme_path` exists.

### Actions
1. Extract TypeScript blocks: `npx codedown typescript < README.md > examples/readme.generated.ts`. Run `npx codedown --help` first to confirm the language argument and the separator option for the installed version; blocks tagged `ts` need `npx codedown ts` as a second pass.
2. If README blocks are fragments that depend on each other (block 2 uses a variable from block 1), concatenation in order is correct. If they are independent and redeclare the same names, extract with a separator and wrap each block in its own `{ ... }` scope, or keep each block in its own file.
3. Add `examples/readme.generated.ts` to `.gitignore`; it is regenerated on every run.

### Output
Generated README sample file.

### Quality Gate
- `wc -l examples/readme.generated.ts` is greater than 0 when the README has TypeScript blocks.

---

## Phase 3: Type-Check and Run as One Script

### Entry Criteria
- Example files and README extraction exist.

### Actions
1. Create `examples/tsconfig.json` extending the root config with `"noEmit": true` and `"include": ["./**/*.ts"]`.
2. Add scripts to `package.json`:
   ```json
   "samples:extract": "codedown typescript < README.md > examples/readme.generated.ts",
   "samples:typecheck": "tsc -p examples",
   "samples:run": "node --test examples/run-samples.test.mjs",
   "test:samples": "npm run build && npm run samples:extract && npm run samples:typecheck && npm run samples:run"
   ```
   `samples:run` executes each example with `tsx` (`npm install --save-dev tsx codedown`) from a small `node:test` file that spawns `npx tsx <file>` per example and asserts exit code 0. Use the stated expected output in the docs as the assertion when one exists.
3. Classify failures:

   | Failure | Class | Fix |
   |---|---|---|
   | `TS2305: Module has no exported member` | Sample uses a removed or renamed API | Update the sample to the current export after confirming with `dist/index.d.ts` |
   | `TS2307: Cannot find module '<pkg>'` | Package name does not resolve to the local build | Fix `paths` or workspace link; never import from `src/` |
   | Runtime error on a network call | Cannot run offline | Keep type check; skip the run for that file with a recorded reason |
   | Output differs from the docs | Docs stale | Change the docs text to the real output |

4. Do NOT add `// @ts-ignore` or `// @ts-expect-error` to samples to pass the type check.

### Output
`sample_test_command`, `sample_test_report`.

### Quality Gate
- `npm run test:samples; echo $?` prints `0` last.
- `git grep -n -E '@ts-(ignore|expect-error)' -- examples` prints nothing.

---

## Worked Example

Illustrative only. Phase 1: `docs/getting-started.mdx` had one usage block; it becomes `examples/getting-started-1.ts` and the page imports it with `raw-loader`.

Phase 2:
```
$ npx codedown typescript < README.md > examples/readme.generated.ts
$ wc -l examples/readme.generated.ts
9 examples/readme.generated.ts
```
Phase 3:
```
$ npm run samples:typecheck
examples/readme.generated.ts:3:10 - error TS2305: Module '"durationkit"' has no exported member 'parse'.
```
`dist/index.d.ts` exports `parseDuration`; the README block is corrected. `npm run test:samples` then exits 0 with `# pass 3` from `node:test`.

---

## Exit Criteria

DONE when every package-usage sample on the site lives in a type-checked, executed file imported into MDX, every README TypeScript block is extracted and type-checked, and `npm run test:samples` exits 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Site is not Docusaurus (MkDocs, VitePress) | **Adjust**: keep samples in `examples/` and use that generator's file-include feature (MkDocs: `pymdownx.snippets` with `--8<--`); do not use `raw-loader`. |
| Phase 1 | `raw-loader` import fails under the site's bundler | **Adjust**: check the Docusaurus docs for "Importing code snippets" for the version in use. |
| Phase 2 | README uses `js` blocks only | **Adjust**: extract with `codedown javascript` and type-check with `"allowJs": true, "checkJs": true`. |
| Phase 3 | Sample needs secrets | **Adjust**: type-check only, record "run skipped: needs <VAR>" in `sample_test_report`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
