# npm Clean Consumer Install Test

**One-line description:** Installs the packed tarball into a fresh consumer project outside the repo and proves that `require`, `import`, blocked deep imports and TypeScript type checking under `NodeNext` all work against the installed copy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `npm_tarball_report` (object, required): From `pkg-node-npm-pack-inspect`; verdict PASS and tarball path.
- `exports_map` (object, required): From `pkg-node-exports-map`; entry points and blocked paths.

---

## Outputs

- `node_install_report` (object): Node and npm versions used, the resolved install path, outputs of the CJS, ESM, blocked-path and `tsc` checks, and verdict.

---

## Phase 1: Create the Consumer and Install

### Entry Criteria
- Tarball exists at the recorded path.

### Actions
1. Make a consumer directory outside the repo: `mkdir /tmp/consumer && cd /tmp/consumer && npm init -y`.
2. Install the tarball by absolute path: `npm install /tmp/npm-out/<file>.tgz`. Do not use `npm link` or a `file:` path to the repo; those resolve to the source folder and hide missing files.
3. Confirm the install is a copy: `node -e "console.log(require.resolve('<name>/package.json'))"` prints a path under `/tmp/consumer/node_modules`.
4. Read peer dependency warnings in the install output. A missing peer the library needs at runtime is a finding.
5. Test the lowest supported Node from `engines.node` too, using a version manager (`nvm use 18`, `fnm use 18` or `volta run --node 18`).

### Output
Installed consumer.

### Quality Gate
- Resolved path is under `/tmp/consumer/node_modules`.
- `npm ls <name>` shows the expected version.

---

## Phase 2: Runtime Import Checks

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. CJS (dual or CJS packages): `node -e "const m=require('<name>'); console.log(Object.keys(m))"`.
2. ESM: `node --input-type=module -e "import * as m from '<name>'; console.log(Object.keys(m))"`.
3. Each public subpath: repeat with `'<name>/errors'`.
4. Blocked path: `node -e "require('<name>/dist/internal.js')"` must fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
5. Call one real function per entry with a known input and compare output to the README example.

### Output
Runtime check results.

### Quality Gate
- CJS and ESM key lists match the `exports_map` public names.
- Blocked-path test prints `ERR_PACKAGE_PATH_NOT_EXPORTED`.

---

## Phase 3: TypeScript Consumer Check

### Entry Criteria
- Package ships types.

### Actions
1. `npm install -D typescript` in the consumer.
2. Write `tsconfig.json`: `{"compilerOptions": {"module": "NodeNext", "moduleResolution": "NodeNext", "strict": true, "noEmit": true}, "include": ["*.ts", "*.cts", "*.mts"]}`.
3. Write `esm.mts`: `import { parse } from "<name>"; const r: Record<string, unknown> = parse("a=1"); console.log(r);`
4. Write `cjs.cts` (CommonJS TypeScript): `import qs = require("<name>"); console.log(qs.parse("a=1"));`. Use exactly this `import x = require()` form; destructuring in that form is not valid TypeScript.
5. Run `npx tsc -p .`. It must exit 0 with no output.
6. If the package targets bundler users, repeat with `"module": "ESNext", "moduleResolution": "Bundler"`.

### Output
`node_install_report`.

### Quality Gate
- `npx tsc -p .` exits 0 for each configured resolution mode.

---

## Worked Example

Illustrative. `@acme/qs-lite@3.0.0`, Node 18 and 22.

Phase 1:
```
$ npm install /tmp/npm-out/acme-qs-lite-3.0.0.tgz
added 1 package in 0.4s
$ node -e "console.log(require.resolve('@acme/qs-lite/package.json'))"
/tmp/consumer/node_modules/@acme/qs-lite/package.json
```
Phase 2 (Node 18):
```
[ 'QsError', 'parse', 'stringify' ]
[ 'QsError', 'parse', 'stringify' ]
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './dist/internal.js' is not defined by "exports"
```
Phase 3: `npx tsc -p .` exits 0. Verdict PASS.

---

## Exit Criteria

DONE when the tarball installs as a copy, CJS and ESM imports expose the public names on the lowest and current Node, blocked paths fail, and `tsc` passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Resolved path points at the repo | **Retry**: remove `node_modules` and install the `.tgz` by path. |
| Phase 2 | `ERR_REQUIRE_ESM` on `require` | **Return**: to `pkg-node-dual-esm-cjs`; the CJS build is missing or misrouted. |
| Phase 3 | TS error `TS7016: Could not find a declaration file` | **Return**: to `pkg-node-types-lint`; types are not resolved for that mode. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
