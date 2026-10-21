# Node Lockfile Hygiene

**One-line description:** Makes a Node project install the same tree every time before any upgrade: exactly one package manager and lockfile, a lockfile that `npm ci` (or the pnpm/yarn frozen install) accepts, a pinned package manager version, and no stray `--legacy-peer-deps` hiding conflicts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `manifest_files`, `lockfile`, `install_command`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `install_ok`, `pre_existing_failures`, `flaky_tests`.

---

## Outputs

- `lockfile_status` (object): `tool`, `tool_version`, `lockfile`, `lockfile_version`, `in_sync` (bool), `peer_dep_overrides` (list of where `legacy-peer-deps` or `overrides`/`resolutions` appear), `fixes_committed`, `new_baseline_sha`, `notes`. Also written to `<work_dir>/lockfile.json`.

---

## Phase 1: Audit The Lock Setup

### Entry Criteria
- `upgrade_scope.stack == "node"`.

### Actions
1. One manager only. If more than one of `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` is tracked, read the CI install step and the `packageManager` field (`npm pkg get packageManager`). The manager CI uses wins. Ask the user before removing the other lockfile.
2. Record the manager version: `npm --version`, `pnpm --version` or `yarn --version`, and the `packageManager` field (Corepack reads it, for example `"pnpm@9.12.0"`).
3. npm only: read `lockfileVersion` with `node -p "require('./package-lock.json').lockfileVersion"`. npm 7 and 8 write 2; npm 9 and later write 3. A mismatch between team npm versions causes lockfile churn in every PR.
4. Frozen install test (this is the sync check):

| Manager | Command | Fails when |
|---|---|---|
| npm | `npm ci` | `package.json` and `package-lock.json` disagree (`npm ci` can only install packages when your package.json and package-lock.json are in sync) |
| pnpm | `pnpm install --frozen-lockfile` | `ERR_PNPM_OUTDATED_LOCKFILE` |
| yarn berry | `yarn install --immutable` | `YN0028: The lockfile would have been modified by this install, which is explicitly forbidden.` |
| yarn classic | `yarn install --frozen-lockfile` | `Your lockfile needs to be updated` |

5. Find peer dependency escape hatches: `grep -n 'legacy-peer-deps\|strict-peer-dependencies\|auto-install-peers' .npmrc` and `npm pkg get overrides resolutions pnpm.overrides`. Record each.
6. Find duplicates worth knowing about: `npm ls --all --json > <work_dir>/npm-ls.json` (exit code non-zero means invalid or missing peers; read `problems`). For pnpm: `pnpm ls --depth Infinity --json`.

### Output
`tool`, `tool_version`, `lockfile_version`, `in_sync`, `peer_dep_overrides`.

### Quality Gate
- The frozen install command and its exit code are saved in `<work_dir>/lockfile.json`.
- `npm ls` (or `pnpm ls`) problems are saved, even when the list is empty.

---

## Phase 2: Repair Without Upgrading

### Entry Criteria
- `in_sync == false`, or two lockfiles exist and the user chose one.

### Actions
1. Regenerate the lockfile from what is already resolved. Do not delete `node_modules` and the lockfile together; that re-resolves every range to the newest version and is an upgrade in disguise.
   - npm: `npm install --package-lock-only` (updates the lock to match package.json, keeping existing resolutions where ranges allow).
   - pnpm: `pnpm install --lockfile-only`.
   - yarn berry: `yarn install --mode=update-lockfile`.
   - yarn classic: `yarn install` (no frozen flag), then review the diff.
2. Check what moved: `git diff package-lock.json | grep -E '^[-+]\s+"version":' | head -50`. Each changed version must belong to a package whose range in `package.json` changed. Any other changed version: revert with `git checkout -- package-lock.json` and report.
3. If the user chose to remove a second lockfile: `git rm <other-lockfile>` in the same commit, and set `packageManager` only if the user approves (`npm pkg set packageManager=pnpm@<version>`).
4. Do not add `--legacy-peer-deps` or `--force` to make the install pass. If peer errors (`ERESOLVE unable to resolve dependency tree`) appear, record them; they are input to `dup-upgrade-order-plan`.
5. Run the frozen install, then `test_command`. Results must equal the baseline.
6. Commit alone: `git commit -am "deps: repair node lockfile (no range changes)"`. Record `new_baseline_sha`.

### Output
Repaired lockfile, `fixes_committed`, `new_baseline_sha`.

### Quality Gate
- The frozen install from Phase 1 now exits 0.
- Every changed version in the lock diff maps to a changed range in `package.json`, or the diff is empty.
- Test failures equal baseline pre-existing failures plus at most known flaky tests.

---

## Phase 3: Lock Rules For The Rest Of The Run

### Entry Criteria
- Frozen install passes.

### Actions
1. Write these rules into `notes`:
   - Bump with an exact target: `npm install <name>@<version>` (add `--save-exact` only if `.npmrc` has `save-exact=true` or existing ranges are exact), `pnpm add <name>@<version>`, `yarn up <name>@<version>` (berry) or `yarn upgrade <name>@<version>` (classic).
   - Packages that share a peer range move in one command, for example `npm install react@19 react-dom@19`.
   - After each bump run `npm dedupe` only if `npm ls` shows duplicates introduced by that bump, and commit lock plus manifest together.
2. Record `engines` (`npm pkg get engines`) and `.nvmrc` / `.node-version` contents. Upgrades whose `engines.node` exceeds the current runtime are blocked until `dup-node-lts-upgrade` runs.

### Output
`lockfile_status`.

### Quality Gate
- `<work_dir>/lockfile.json` parses with `node -e "JSON.parse(require('fs').readFileSync('.dep-upgrade/lockfile.json'))"`.

---

## Worked Example

Illustrative only. npm 10 project with both `package-lock.json` and an old `yarn.lock`; CI runs `npm ci`.

- Phase 1: `npm ci` fails: `npm ci can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Missing: zod@3.23.8 from lock file`. `.npmrc` contains `legacy-peer-deps=true`.
- Phase 2: user approves removing `yarn.lock`. `npm install --package-lock-only` adds `zod`; version diff shows only `zod`. `git rm yarn.lock`. `npm ci` exits 0; tests equal baseline. Commit `5be03c1`. `legacy-peer-deps` stays, recorded as a peer override for the order plan.
- Phase 3: notes record `engines.node=">=18"`, `.nvmrc=20`.

---

## Exit Criteria

DONE when one lockfile remains, the frozen install passes, repair changed no unrelated versions, tests match the baseline, and bump rules are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lockfiles of two managers | **Stop**: show CI evidence and ask which to keep. |
| Phase 2 | Lock-only install moves unrelated versions | **Retry**: revert and repeat with the installed npm major that wrote the lock (`npx npm@<major> install --package-lock-only`). |
| Phase 2 | `ERESOLVE` peer conflict | **Return**: record the full conflict block; do not add `--legacy-peer-deps`. |
| Phase 2 | Tests differ from baseline | **Stop**: `git revert` the repair commit and report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
