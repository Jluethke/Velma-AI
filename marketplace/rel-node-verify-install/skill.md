# npm Post-Publish Install Verification

**One-line description:** Installs the just-published version from the npm registry into an empty project outside the repository, proves `require()`, `import`, every public `exports` subpath and TypeScript type resolution work, checks `npm audit signatures`, and compares the registry integrity with the packed tarball.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_name` (string, required): npm package name.
- `next_version` (object, required): Uses `semver`.
- `npm_release_url` (object, required): From rel-node-publish-npm-provenance; holds the registry integrity and dist-tags.

---

## Outputs

- `node_install_report` (object): `status` (`PASS` or `FAIL`), install command, CJS result, ESM result, subpath results, type check result, `npm audit signatures` output, integrity comparison.

---

## Phase 1: Clean Install

### Entry Criteria
- `npm_release_url` present.

### Actions
1. `D=$(mktemp -d) && cd "$D" && npm init -y`. Do not run inside the package repository or a workspace; npm may link the local package instead of downloading it.
2. Install the exact version: `npm install --no-fund --no-audit <package_name>@<semver>`. If `E404`/`ETARGET` appears right after publish, retry within the user's attempt limit.
3. Confirm what was installed: `npm ls <package_name>` shows `<package_name>@<semver>`, and `node -p "require('./node_modules/<package_name>/package.json').version"` prints the version.
4. Integrity: `node -p "require('./package-lock.json').packages['node_modules/<package_name>'].integrity"` equals `npm_release_url` registry integrity (and therefore the packed tarball).
5. Signatures and provenance: `npm audit signatures`. Read the summary lines: `audited N packages`, `N packages have verified registry signatures`, and `N packages have verified attestations` (the package should be counted when provenance was published).

### Output
Installed project.

### Quality Gate
- `npm ls` shows the exact version.
- Lockfile integrity equals the registry integrity.
- `npm audit signatures` exits 0.

---

## Phase 2: Module Formats and Subpaths

### Entry Criteria
- Installed.

### Actions
1. Read the published `exports`: `node -p "JSON.stringify(require('./node_modules/<package_name>/package.json').exports, null, 2)"`.
2. CommonJS (if a `require` or `default` condition exists, or no `exports` and `type` is not `module`): `node -e "const m = require('<package_name>'); console.log(Object.keys(m))"`.
3. ESM: `node --input-type=module -e "import * as m from '<package_name>'; console.log(Object.keys(m))"`.
4. For each subpath key in `exports` (for example `./utils`), repeat the matching require or import with `<package_name>/utils`.
5. A package that is ESM-only must fail `require()` with `ERR_REQUIRE_ESM` on Node versions that do not support requiring ESM; that is expected only if the README says ESM-only. Record actual behavior per Node version.
6. Test on the lowest Node version in `engines.node` and the current LTS (for example `npx -y node@<major> -e "..."`).

### Output
Format and subpath results.

### Quality Gate
- Each documented entry point prints its export keys with exit code 0.
- Each tested Node version is recorded with its result.

---

## Phase 3: Types

### Entry Criteria
- Phase 2 done. The package ships types (`types` field or `types` export condition).

### Actions
1. `npm install --no-save typescript`.
2. Write `check.ts`: `import * as m from '<package_name>'; const keys: string[] = Object.keys(m); console.log(keys);`.
3. Check under the resolution modes users run:
   - `npx tsc --noEmit --module nodenext --moduleResolution nodenext check.ts`
   - `npx tsc --noEmit --module esnext --moduleResolution bundler check.ts`
4. Optionally confirm with `npx --yes @arethetypeswrong/cli <package_name>@<semver>`, which resolves the published package from the registry.
5. Set `status` = `PASS` only if every check in all phases passed.

### Output
`node_install_report`.

### Quality Gate
- Both `tsc` commands exit 0, or each failure is recorded with its error code (for example `TS7016` missing declaration).
- `status` agrees with the recorded exit codes.

---

## Worked Example

Illustrative. `@acme/fetcher@3.3.0`.

- Phase 1: `npm install @acme/fetcher@3.3.0` in `/tmp/tmp.Q9`; integrity `sha512-7Qk...==` matches; `npm audit signatures` prints `1 package has a verified registry signature` and `1 package has a verified attestation`.
- Phase 2: `exports` has `.` and `./node`. `require('@acme/fetcher')` prints `[ 'fetchJson', 'fetchText' ]`; the ESM import prints the same keys; `@acme/fetcher/node` works in both. Node 20 and 22 pass.
- Phase 3: `tsc --moduleResolution nodenext` and `bundler` both exit 0. `status` = `PASS`.

---

## Exit Criteria

DONE when the published version installs from the registry in a clean project, its integrity and signatures verify, every documented entry point loads in the supported module formats, types resolve, and `status` reflects all results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ETARGET No matching version` right after publish | **Retry**: registry propagation, within the user's attempt limit. |
| Phase 1 | `npm audit signatures` reports missing or invalid signatures | **Stop**: FAIL; do not announce the release. |
| Phase 2 | `ERR_PACKAGE_PATH_NOT_EXPORTED` for a documented subpath | **Return**: FAIL; `exports` is missing the key. |
| Phase 2 | `Cannot find module` for a file in `dist/` | **Return**: FAIL; the `files` field excluded it. |
| Phase 3 | `TS7016` or `TS2307` | **Return**: FAIL; types not shipped or `types` condition order wrong (it must come first in each condition block). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
