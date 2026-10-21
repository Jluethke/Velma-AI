# Node CLI Packaging with npm bin

**One-line description:** Packages a Node CLI for `npm install -g` and `npx` with a correct `bin` map, `#!/usr/bin/env node` shebang with LF line endings, a `files` allowlist, `engines`, and a build step for TypeScript, then proves the packed tarball installs and runs from a clean prefix before `npm publish`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tool_name` (string, required): Executable name and, usually, package name.
- `release_version` (string, required): Semver version, for example `1.4.0`.
- `project_dir` (string, required): Root of the Node project.
- `e2e_run_log` (string, required): Passing log from `cli-node-e2e-tests`.

---

## Outputs

- `package_artifact` (string[]): Path of the packed tarball, for example `logtrim-1.4.0.tgz`.
- `install_check_log` (string): Output of the dry-run, pack, install and run checks.

---

## Phase 1: package.json and the bin File

### Entry Criteria
- `e2e_run_log` shows `# fail 0`.

### Actions
1. Set these keys:
```json
{
  "name": "logtrim",
  "version": "1.4.0",
  "type": "module",
  "bin": { "logtrim": "bin/logtrim.js" },
  "files": ["bin/", "src/"],
  "engines": { "node": ">=20" }
}
```
   The `engines` range is the user's decision (match the oldest Node the e2e suite ran on); the value above is an example only. For TypeScript, point `bin` at the compiled file (`dist/bin/logtrim.js`), put `dist/` in `files`, and add `"prepack": "npm run build"` so `npm pack` and `npm publish` build first.
2. The bin file's first line must be exactly `#!/usr/bin/env node`. Check: `head -1 bin/logtrim.js`.
3. The bin file must use LF line endings. CRLF makes Unix report `env: 'node\r': No such file or directory`. Check: `file bin/logtrim.js` must not say `CRLF`. Add `bin/*.js text eol=lf` to `.gitattributes`.
4. Set the version with `npm version 1.4.0 --no-git-tag-version` (or let the user's release flow tag it).
5. npm sets the executable bit when installing the package, so `chmod +x` is needed only for running `./bin/logtrim.js` directly from the repo.

### Output
`package.json` and bin file ready.

### Quality Gate
- `head -1 bin/logtrim.js` prints `#!/usr/bin/env node`.
- `node -p "require('./package.json').bin"` prints the map with the tool name.

---

## Phase 2: Pack and Inspect

### Entry Criteria
- Phase 1 done.

### Actions
1. `npm pack --dry-run` lists every file that would ship. Confirm the bin file, all runtime sources and `package.json` are present, and tests, fixtures, `.env` and source maps you do not want are absent.
2. `npm pack` writes `logtrim-1.4.0.tgz`.
3. `npm publish --dry-run` reports the package name, version and size without uploading.

### Output
Tarball.

### Quality Gate
- `npm pack --dry-run` output contains `bin/logtrim.js` and no `test/` paths.

---

## Phase 3: Clean Install and Publish

### Entry Criteria
- Tarball exists.

### Actions
1. Install into an empty prefix and run:
```
TMP=$(mktemp -d)
npm install --global --prefix "$TMP" ./logtrim-1.4.0.tgz
"$TMP/bin/logtrim" --version; echo "exit=$?"      # Linux/macOS layout
# Windows layout: "$TMP/logtrim.cmd" --version
```
2. Run through `npx` from a directory outside the project: `cd "$TMP" && npm exec --yes --package=<abs path>/logtrim-1.4.0.tgz -- logtrim --help >/dev/null; echo "exit=$?"`.
3. Publish only with the user's go-ahead: `npm publish` (add `--access public` for a scoped package's first publish). From GitHub Actions, `npm publish --provenance` with `permissions: id-token: write` attaches provenance. A published version can never be republished; mistakes need a new version.
4. Save all outputs as `install_check_log`.

### Output
`package_artifact`, `install_check_log`.

### Quality Gate
- The prefix install prints `1.4.0` and `exit=0`.
- The `npm exec` run prints `exit=0`.

---

## Do Not

- Do not publish from a dirty working tree without running `npm pack --dry-run` first.
- Do not add `"preferGlobal"` or postinstall scripts that modify the user's shell; they are not needed for `bin`.
- Do not test only with `npm link`; it uses your source tree, not the packed files.

---

## Worked Example

Illustrative. First attempt from a Windows checkout:
```
$ "$TMP/bin/logtrim" --version
/usr/bin/env: 'node\r': No such file or directory
```
Fix: `.gitattributes` with `bin/*.js text eol=lf`, re-checkout, repack.
```
$ npm pack --dry-run 2>&1 | grep -E "bin/|src/" | head -3
npm notice 412B bin/logtrim.js
npm notice 3.1kB src/cli.js
$ npm install --global --prefix "$TMP" ./logtrim-1.4.0.tgz && "$TMP/bin/logtrim" --version; echo "exit=$?"
1.4.0
exit=0
```

---

## Exit Criteria

DONE when the packed tarball contains exactly the runtime files, installs into a clean prefix, runs via its `bin` name and via `npm exec`, and publishing waits for the user.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `e2e_run_log` has failures | **Stop**: return to `cli-node-e2e-tests`. |
| Phase 2 | Runtime file missing from pack list | **Adjust**: add its directory to `files`; repack. |
| Phase 3 | `Cannot find module` after install | **Return**: a runtime import is in `devDependencies`; move it to `dependencies`. |
| Phase 3 | `EPUBLISHCONFLICT` / version exists | **Adjust**: bump the version; never unpublish to reuse it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
