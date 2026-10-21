# package.json Publishing Fields

**One-line description:** Sets the `package.json` fields npm publishing depends on (name, version, license, repository, files, engines, sideEffects, publishConfig, lifecycle scripts) and validates them with `npm pkg` commands and `npm pkg fix`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `license_report` (object, required): From `pkg-license-metadata`; the npm `license` value.
- `release_version` (string, required): From `pkg-release-version-lock`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `package_json_config` (object): The final values of each field set, the `npm pkg get` output proving them, and the list of `npm pkg fix` changes.

---

## Phase 1: Identity and Legal Fields

### Entry Criteria
- `package.json` exists and parses.

### Actions
1. Set each field with `npm pkg set` so the JSON stays valid:
   ```
   npm pkg set version=<release_version>
   npm pkg set license=<spdx from license_report>
   npm pkg set description="<one sentence>"
   npm pkg set repository.type=git repository.url=git+https://github.com/<owner>/<repo>.git
   npm pkg set bugs.url=https://github.com/<owner>/<repo>/issues homepage=https://github.com/<owner>/<repo>#readme
   ```
   For a package in a monorepo subfolder add `repository.directory=packages/<name>`.
2. `repository.url` must match the GitHub repository that publishes with provenance; npm checks the provenance statement against it and rejects a mismatch.
3. Remove `"private": true` if present (it blocks publishing); confirm with the user first, since it may be intentional.
4. Use `npm version <release_version> --no-git-tag-version` instead of step 1's version line if the project prefers; it also updates `package-lock.json`.

### Output
Identity fields set.

### Quality Gate
- `npm pkg get name version license repository private` prints the expected values and `{}` or nothing for `private`.

---

## Phase 2: Content and Runtime Fields

### Entry Criteria
- Phase 1 done.

### Actions
1. `files`: an allowlist of what ships. Typical: `npm pkg set "files[0]"=dist`. Add `"files[1]"=src` only if sourcemaps reference source files. `package.json`, `README*` and `LICENSE*` are always included; you do not list them. Prefer `files` over `.npmignore`; if neither exists, npm falls back to `.gitignore` rules, which usually ship tests.
2. `engines.node`: the lowest tested Node range, for example `npm pkg set engines.node=">=18"`. Ask the user if unknown.
3. `sideEffects`: set to `false` only when importing any module has no side effects (no global registration, no CSS import, no polyfill). Wrong `false` makes bundlers drop needed code. If some files have effects, list them: `"sideEffects": ["./dist/polyfill.js"]`.
4. `publishConfig`: for a scoped public package `npm pkg set publishConfig.access=public`. Add `publishConfig.provenance=true` when publishing from supported CI.
5. Scripts: `"prepack": "npm run build"` (runs before `npm pack` and `npm publish`). Do not use `prepublish` (deprecated meaning). Do not put tests in `prepare` (runs on every install from git).
6. Move build-only tools to `devDependencies`. A package that the library imports at runtime must be in `dependencies`; one the host app must provide (React, for example) goes in `peerDependencies`.

### Output
Content and runtime fields set.

### Quality Gate
- `npm pkg get files engines sideEffects publishConfig scripts.prepack` prints the expected values.

---

## Phase 3: Normalize and Validate

### Entry Criteria
- Phase 2 done.

### Actions
1. Run `npm pkg fix`. It corrects common errors (for example a `repository` shorthand or a `bin` path) the same way `npm publish` would. Run `git diff package.json` and record each change it made.
2. Check runtime imports against `dependencies`: for each bare import in `dist/`, the package must appear in `dependencies` or `peerDependencies`: `grep -ohE "from \"[^./][^\"]*\"|require\(\"[^./][^\"]*\"\)" dist/*.js dist/*.cjs | sort -u`. Ignore Node built-ins (`node:` prefix or names like `fs`).
3. Confirm the lockfile is in sync: `npm install --package-lock-only` then `git diff --stat package-lock.json` shows no unexpected changes.

### Output
`package_json_config`.

### Quality Gate
- `npm pkg fix` leaves no further diff on a second run.
- Every bare runtime import appears in `dependencies` or `peerDependencies`.

---

## Worked Example

Illustrative. `@acme/qs-lite`, `release_version = 3.0.0`, license `MIT`.

Phase 1:
```
$ npm pkg get name version license repository
{ "name": "@acme/qs-lite", "version": "3.0.0", "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/acme/qs-lite.git" } }
```
Phase 2: `files = ["dist"]`, `engines.node = ">=18"`, `sideEffects = false` (no module performs work at import), `publishConfig.access = public`, `prepack = npm run build`.

Phase 3: `npm pkg fix` changed nothing. Runtime imports in `dist/`: none besides `node:` built-ins.

---

## Exit Criteria

DONE when identity, legal, content and runtime fields are set, `npm pkg fix` is stable, and runtime imports match declared dependencies.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `private: true` set on purpose | **Stop**: the owner decides; do not remove it silently. |
| Phase 2 | Unsure whether modules have side effects | **Adjust**: omit `sideEffects`; omission is safe, a wrong `false` is not. |
| Phase 3 | Runtime import missing from `dependencies` | **Adjust**: `npm install <pkg>` to add it with a range; rebuild. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
