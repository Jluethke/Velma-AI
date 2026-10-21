# Node Outdated Inventory

**One-line description:** Produces a normalized list of outdated npm, pnpm or yarn dependencies from `npm outdated --json` (or the pnpm/yarn equivalent), reading Current, Wanted and Latest correctly, separating direct from transitive and dev from runtime, and flagging packages that must move together because of peer ranges.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `target_packages`, `work_dir`.
- `lockfile_status` (object, required): From `dup-node-lockfile-hygiene`. Frozen install must pass.

---

## Outputs

- `outdated_inventory` (object[]): One record per outdated package: `ecosystem` (`npm`), `name`, `current`, `wanted`, `latest`, `update_type`, `direct`, `dev`, `workspace` (for monorepos), `peer_group` (names that share a peer range), `engines_node` of `latest`. Also written to `<work_dir>/outdated.json`.

---

## Phase 1: Collect Raw Outdated Data

### Entry Criteria
- `node_modules` was installed with the frozen command from the lockfile.

### Actions
1. Run the command for the manager, saving raw output:

| Manager | Command | Notes |
|---|---|---|
| npm | `npm outdated --json > .dep-upgrade/npm-outdated.json` | exit code 1 means "something is outdated", not an error |
| npm workspaces | `npm outdated --json --workspaces --include-workspace-root` | adds `dependent` per entry |
| npm transitive | `npm outdated --all --json` | very long; use only for a named package |
| pnpm | `pnpm outdated --format json` (add `-r` for workspaces) | |
| yarn classic | `yarn outdated --json` | NDJSON lines |
| yarn berry | `yarn upgrade-interactive` is interactive; use `yarn npm info <name> --fields version` per package, or `npx npm-check-updates --packageManager yarn --jsonUpgraded` | |

2. Read the columns correctly:
   - `current`: installed version. Missing means not installed (run the frozen install first).
   - `wanted`: newest version satisfying the range in `package.json` (`^1.2.3` allows `<2.0.0`; `^0.2.3` allows only `<0.3.0`; `~1.2.3` allows `<1.3.0`).
   - `latest`: the version tagged `latest` on the registry. It can be lower than `wanted` when a maintainer moves the tag; it never includes prereleases.
   - In the colored table, red means `current < wanted` (an in-range update exists), yellow means `wanted == current` but `latest` is outside the range.
3. Optional cross-check that lists target versions for all direct deps without installing: `npx npm-check-updates --jsonUpgraded` (prints proposed versions; it does not modify files unless `-u` is passed). Do not pass `-u`.

### Output
Raw outdated JSON.

### Quality Gate
- The raw JSON parses: `node -e "JSON.parse(require('fs').readFileSync('.dep-upgrade/npm-outdated.json'))"` exits 0.

---

## Phase 2: Normalize And Classify

### Entry Criteria
- Raw JSON parses.

### Actions
1. `direct=true` when the name is a key in `dependencies`, `devDependencies`, `optionalDependencies` or `peerDependencies` of a tracked `package.json`. `dev=true` when only in `devDependencies`. `npm outdated` without `--all` already lists direct dependencies only.
2. Classify `update_type` from `current` to `latest` with semver: major if major differs, or if major is `0` and minor differs (caret ranges treat `0.x` minors as breaking); minor if minor differs; else patch. Prerelease `latest` values (containing `-`) are recorded but never planned.
3. Build `peer_group`: for each outdated package, read `npm view <name>@<latest> peerDependencies --json`. Any other direct dependency named there whose current version does not satisfy the new peer range joins the group. Typical groups: `react` + `react-dom` + `@types/react` + `@types/react-dom`; `eslint` + its plugins; `@angular/*`; `@babel/*`; `typescript` + `@typescript-eslint/*`.
4. Record `engines_node` of `latest`: `npm view <name>@<latest> engines --json`. If it excludes the current Node version, mark `blocked_by_runtime`.
5. Filter to `target_packages` when given (keep group members of targets).
6. Merge into `<work_dir>/outdated.json` by (`ecosystem`, `name`); do not delete other ecosystems' records.

### Output
`outdated_inventory`.

### Quality Gate
- Every record has `update_type` and `direct` set.
- Every `peer_group` entry was produced by an `npm view ... peerDependencies` call whose output is saved in `<work_dir>/peers/`.

---

## Worked Example

Illustrative only. npm 10, Node 20.

- Phase 1: `npm outdated --json` prints `"react": {"current":"18.2.0","wanted":"18.3.1","latest":"19.1.1","dependent":"web","location":"node_modules/react"}`, `"vite": {"current":"5.4.2","wanted":"5.4.20","latest":"7.1.5"}`.
- Phase 2: react: `major`, direct, runtime; `npm view react-dom@19.1.1 peerDependencies --json` prints `{"react":"^19.1.1"}`, so `peer_group=["react","react-dom","@types/react","@types/react-dom"]`. vite 7: `npm view vite@7.1.5 engines --json` prints `{"node":"^20.19.0 || >=22.12.0"}`; installed Node 20.11.1 fails it, so `blocked_by_runtime`.

---

## Exit Criteria

DONE when `<work_dir>/outdated.json` has one classified npm record per outdated package in scope, with peer groups and runtime blocks recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm outdated` exits 1 | **Adjust**: that is normal when anything is outdated; parse the JSON. |
| Phase 1 | Registry 401/403 for scoped packages | **Stop**: ask the user to configure `.npmrc` auth; never paste tokens into files. |
| Phase 2 | `latest` lower than `current` (deprecated release line) | **Return**: record it with `update_type=none` and a note; do not plan a downgrade. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
