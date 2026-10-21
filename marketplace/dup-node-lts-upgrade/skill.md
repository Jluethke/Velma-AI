# Node.js LTS Runtime Upgrade

**One-line description:** Moves a project from one Node.js major to a newer Active or Maintenance LTS line by changing every place the version is declared (`.nvmrc`, `engines`, CI, Dockerfile, `@types/node`), rebuilding native addons, and clearing the new major's runtime deprecations and removals.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `runtime_version`, `install_command`, `test_command`, `build_command`, `work_dir`.
- `rollback_plan` (object, required): From `dup-rollback-plan`. Uses `artifact_reference` and the runtime one-way change entry.
- `node_target_version` (string, optional): Target major, for example `22`. When absent, use the newest line marked "Active LTS" on the official release schedule.

---

## Outputs

- `runtime_upgrade_log` (object): `from`, `to`, `declarations_changed` (file:line list), `native_addons_rebuilt`, `removed_api_hits`, `commit`, `test_result`. Also written to `<work_dir>/node-lts.json`.

---

## Phase 1: Pick The Target And Find Every Declaration

### Entry Criteria
- `upgrade_scope.stack == "node"`.

### Actions
1. Read the release status at `https://nodejs.org/en/about/previous-releases` (or the `nodejs/Release` schedule). Only even-numbered majors become LTS. Choose `node_target_version` or the current Active LTS. Record its status and end-of-life date as printed there; do not state dates from memory.
2. Find every declaration: `git grep -nE "node-version|NODE_VERSION|FROM node:|\"node\":|nodejs[0-9]+|setup-node|runtime: nodejs|engines" -- ':!*.lock' ':!package-lock.json'` and the files `.nvmrc`, `.node-version`, `.tool-versions`, `volta` field in `package.json`, `Dockerfile*`, `.github/workflows/*`, `.gitlab-ci.yml`, serverless or cloud function configs (`runtime: nodejs20.x` in AWS SAM/Serverless).
3. Read the target major's changelog "Notable changes" and "Semver-Major Commits" sections for each major you skip (20 to 22 means reading 21 and 22). Record removed or End-of-Life APIs.
4. Grep the project for each removed API and for `process.binding(` (internal API that majors break).

### Output
Target version, declaration list, removed API hits.

### Quality Gate
- Every declaration file:line is listed and the grep command is saved.
- Release status was read from the official page (URL recorded).

---

## Phase 2: Switch The Runtime Locally

### Entry Criteria
- Declarations listed.

### Actions
1. Install the target with the version manager the repo already uses: `nvm install 22 && nvm use 22`, `fnm use --install-if-missing 22`, `volta install node@22`, or `asdf install nodejs <version>`.
2. Remove the old build: `rm -rf node_modules`. Reinstall with the frozen command (`npm ci`). Native addons compile against the new ABI. If an error says `was compiled against a different Node.js version using NODE_MODULE_VERSION X. This version of Node.js requires NODE_MODULE_VERSION Y`, run `npm rebuild` (or upgrade the addon if its install script fails).
3. List native addons: `find node_modules -name '*.node' -not -path '*/test/*' | sed 's|node_modules/||; s|/.*||' | sort -u`. Record each as `native_addons_rebuilt`.
4. Run `build_command` and `NODE_OPTIONS=--trace-deprecation <test_command>`. New runtime deprecations go to `dup-node-deprecation-sweep` rules; new failures caused by removed APIs are fixed one per commit.

### Output
Passing local build and tests on the new major.

### Quality Gate
- `node --version` prints the target major.
- `npm ci` exits 0 and test failures equal the baseline.

---

## Phase 3: Change Declarations In One Commit

### Entry Criteria
- Local run passes.

### Actions
1. Update every declaration from Phase 1 to the target major, together:
   - `.nvmrc` / `.node-version`: `22`.
   - `package.json` `engines.node`: widen or move the floor as the user decides (for example `">=22"`); `npm pkg set engines.node=">=22"`.
   - CI: `actions/setup-node` `node-version` or better `node-version-file: .nvmrc`. If CI runs a version matrix, add the target before removing the old one.
   - Docker: `FROM node:22-<variant>` keeping the same variant (`-alpine`, `-bookworm-slim`); pin by digest if the file pinned by digest before.
   - Serverless runtime identifiers (for example `nodejs22.x`) only if the platform lists that runtime as supported; check the provider's runtime list.
2. Bump `@types/node` to the matching major: `npm install --save-dev @types/node@22`.
3. Run the frozen install, build and tests again. Commit: `git commit -am "runtime: node <from> -> <to>"`.
4. Write `<work_dir>/node-lts.json`.

### Output
`runtime_upgrade_log`.

### Quality Gate
- `git grep -nE '<old-major>' -- .nvmrc .node-version Dockerfile* .github/workflows` prints no remaining old version reference (except an intentional matrix entry).
- `npx tsc --noEmit` passes when the project has `tsconfig.json`.

---

## Worked Example

Illustrative only. Node 20 to 22, npm, Docker, GitHub Actions.

- Phase 1: previous-releases page lists 22 as LTS. Declarations: `.nvmrc:1 20`, `package.json engines ">=18"`, `Dockerfile:1 FROM node:20-alpine`, `.github/workflows/ci.yml:18 node-version: 20`. Node 21 and 22 notes read; project grep finds no removed APIs.
- Phase 2: `nvm install 22`; `rm -rf node_modules && npm ci` fails at first with the `NODE_MODULE_VERSION 115 ... requires NODE_MODULE_VERSION 127` message from `bcrypt`; `npm rebuild bcrypt` fixes it. Tests: same as baseline; new `[DEP0040]` warning noted.
- Phase 3: all four declarations changed, CI switched to `node-version-file: .nvmrc`, `@types/node@22`. Commit `c03d8aa`.

---

## Exit Criteria

DONE when every runtime declaration names the target major, native addons rebuild, and build and tests match the baseline on the new runtime.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Native addon has no build for the new ABI and fails to compile | **Return**: record it; upgrade that addon first as its own plan item, or keep the old runtime. |
| Phase 2 | Test failures from removed API | **Adjust**: fix one API per commit using the deprecations page replacement. |
| Phase 3 | Hosting platform does not support the target yet | **Stop**: report the platform's supported list; do not change runtime identifiers to unsupported values. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
