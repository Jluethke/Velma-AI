# npm pack Inspection

**One-line description:** Reads `npm pack --dry-run --json` output line by line, confirms every shipped file is intended and every `exports` target is present, checks for secrets and stray files, then produces the real tarball for install testing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_json_config` (object, required): From `pkg-node-package-json-metadata`.
- `types_report` (object, required): From `pkg-node-types-lint`; must be clean.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `npm_tarball_report` (object): Tarball filename and absolute path, file list with sizes, `size` and `unpackedSize`, `integrity`, findings with fixes, and verdict PASS or FAIL.

---

## Phase 1: Dry-Run Pack

### Entry Criteria
- `types_report` final runs are clean.

### Actions
1. Run `npm pack --dry-run --json > /tmp/pack.json`. The `prepack` script runs first and rebuilds.
2. Read the JSON: it is an array with one object holding `name`, `version`, `filename`, `size`, `unpackedSize`, `entryCount`, `integrity`, and `files` (each with `path` and `size`).
3. Print paths: `node -e "for (const f of require('/tmp/pack.json')[0].files) console.log(f.size, f.path)"`.
4. Human-readable alternative: `npm pack --dry-run` prints `Tarball Contents`, then `Tarball Details` with package size, unpacked size and total files.

### Output
File list.

### Quality Gate
- `version` in the JSON equals `release_version` from `package_json_config`.

---

## Phase 2: Check the File List

### Entry Criteria
- File list exists.

### Actions
1. Every target in `exports`, `main`, `types` and `bin` must be in the list: `node -e "const p=require('./package.json');const list=new Set(require('/tmp/pack.json')[0].files.map(f=>f.path));const w=o=>typeof o==='string'?[o]:Object.values(o||{}).flatMap(w);for(const t of [...w(p.exports),p.main,p.types].filter(Boolean)){const k=t.replace(/^\.\//,'');if(!list.has(k))console.log('MISSING',k)}"` prints nothing.
2. Apply this table to each path:

   | Path pattern | Verdict |
   |---|---|
   | `dist/**` build output named in exports | ship |
   | `package.json`, `README*`, `LICENSE*`, `CHANGELOG*` | ship |
   | `*.map` sourcemaps | ship only if the `src/` they reference also ships, otherwise remove them from the build |
   | `src/**`, `test/**`, `__tests__/**`, `*.test.*`, `*.spec.*`, `coverage/**` | do not ship (unless `src` is needed for sourcemaps) |
   | `.env*`, `*.pem`, `*.key`, `.npmrc`, `id_rsa*` | blocking: secret risk |
   | `tsconfig*.json`, `.github/**`, editor folders | do not ship |

3. Grep for secrets in contents: `npm pack` then `tar -xzf <file>.tgz -C /tmp/pk && grep -rIlE "AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|npm_[A-Za-z0-9]{36}" /tmp/pk`. Any hit is blocking.
4. Each "do not ship" or blocking path becomes a finding. Fix through `files` in `package.json` (narrow the allowlist) and rerun Phase 1.

### Output
Findings list.

### Quality Gate
- The MISSING check prints nothing.
- The secret grep prints nothing.
- Every path has a verdict from the table.

---

## Phase 3: Produce the Tarball

### Entry Criteria
- Zero findings.

### Actions
1. Run `npm pack --pack-destination /tmp/npm-out` (check `npm pack --help` if your npm lacks this flag; otherwise run `npm pack` and move the file).
2. The filename is `<name>-<version>.tgz`; for a scoped name `@acme/qs-lite` it is `acme-qs-lite-<version>.tgz`.
3. Record `size`, `unpackedSize` and `integrity` for comparison with the published version later.

### Output
`npm_tarball_report`.

### Quality Gate
- The `.tgz` file exists at the recorded path.
- Verdict PASS only with zero findings.

---

## Worked Example

Illustrative. `@acme/qs-lite@3.0.0`, first dry run.

Phase 1:
```
$ npm pack --dry-run
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 2.4kB README.md
npm notice 2.4kB dist/index.cjs
npm notice 4.9kB dist/index.cjs.map
npm notice 2.1kB dist/index.js
npm notice 4.8kB dist/index.js.map
npm notice 610B dist/index.d.ts
npm notice 610B dist/index.d.cts
npm notice 1.2kB package.json
npm notice 9.8kB test/parse.test.ts
```
Phase 2: `test/parse.test.ts` ships: `files` was missing. Set `files = ["dist"]`. Sourcemaps reference `../src/index.ts`, which does not ship: turn off `sourcemap` in tsup. Rerun: 7 files, no findings.

Phase 3: `/tmp/npm-out/acme-qs-lite-3.0.0.tgz` created.

---

## Exit Criteria

DONE when every shipped file is intended, every entry target is present, no secrets are found, and the tarball exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `prepack` build fails | **Stop**: fix the build; never pack stale `dist/`. |
| Phase 2 | Secret found | **Stop**: remove it, rotate it, add the path to `.gitignore`; never publish. |
| Phase 2 | Entry target missing | **Return**: to `pkg-node-dual-esm-cjs`; the build does not emit it. |
| Phase 3 | `--pack-destination` unknown | **Adjust**: run `npm pack` and move the file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
