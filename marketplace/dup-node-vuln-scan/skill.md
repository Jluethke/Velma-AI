# Node Vulnerability Scan With npm audit

**One-line description:** Scans the Node lockfile with `npm audit` (or `pnpm audit` / `yarn npm audit`), separates runtime from dev-only exposure, traces each vulnerable transitive package to the direct dependency that pulls it in, and picks a fix route without ever running `npm audit fix --force`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `work_dir`.
- `lockfile_status` (object, required): From `dup-node-lockfile-hygiene`. Frozen install must pass.

---

## Outputs

- `vuln_findings` (object[]): One record per (package, advisory): `ecosystem` (`npm`), `name`, `installed`, `advisory_id` (GHSA), `aliases`, `severity`, `vulnerable_range`, `runtime_exposed` (bool), `via_direct` (direct dependency names), `fix_route` (`direct-bump`, `parent-bump`, `override`, `no-fix`), `min_fix`, `fix_update_type`. Also written to `<work_dir>/vulns.json`.

---

## Phase 1: Run The Audit

### Entry Criteria
- Lockfile in sync (audit reads the lockfile, not `node_modules`).

### Actions
1. Full audit to JSON: `npm audit --json > .dep-upgrade/npm-audit-all.json`. Runtime only: `npm audit --omit=dev --json > .dep-upgrade/npm-audit-prod.json`.
2. Other managers: `pnpm audit --json` and `pnpm audit --prod --json`; yarn berry `yarn npm audit --all --recursive --json`; yarn classic `yarn audit --json` (NDJSON).
3. Exit codes: npm exits non-zero when findings at or above `--audit-level` (default `low`) exist. That is not a tool failure.
4. Supply-chain check, separate from advisories: `npm audit signatures` verifies registry signatures and provenance attestations of installed packages. Record any `invalid` result as a blocker.

### Output
Raw audit JSON files.

### Quality Gate
- Both JSON files parse with `node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))" <file>`.

---

## Phase 2: Read The npm Audit JSON Correctly

### Entry Criteria
- JSON parses.

### Actions
1. npm 7+ report shape: `vulnerabilities` is keyed by package name. Each entry has `severity`, `isDirect`, `via` (either advisory objects with `source`, `url`, `title`, `range`, or plain strings naming another vulnerable package it depends on), `effects` (packages that depend on it), `range`, `fixAvailable` (`false`, `true`, or an object `{name, version, isSemVerMajor}`).
2. Only entries whose `via` contains an object are the actual advisory carriers. Entries with string-only `via` are dependents that inherit the problem; do not count them as separate vulnerabilities.
3. `runtime_exposed=true` when the package appears in `npm-audit-prod.json`.
4. Trace the path: `npm explain <name>` (alias `npm why`) prints each chain from a direct dependency. Record the direct names as `via_direct`.
5. Choose `fix_route` with this table:

| Situation | fix_route | What it means |
|---|---|---|
| `isDirect` true and a fixed version exists | `direct-bump` | bump that package |
| transitive; `fixAvailable` object names a direct package and `isSemVerMajor` false | `parent-bump` | bump the named parent within range |
| transitive; parent's latest still pins the vulnerable range | `override` | add an `overrides` entry (npm 8.3+), `pnpm.overrides`, or yarn `resolutions` to force the fixed transitive version, then run the full test suite |
| `fixAvailable` false and no patched version published | `no-fix` | user decides: remove, replace, or accept with a reason |

6. Never run `npm audit fix --force`. It installs semver-major versions of direct dependencies outside any plan. Plain `npm audit fix` (no force) stays within ranges; even so, in this flow only record the route, do not apply it.

### Output
Normalized findings with routes.

### Quality Gate
- Every advisory carrier has a `fix_route`.
- Every `override` route names the exact transitive version that is outside `vulnerable_range` (check with `npm view <name>@<version> version`).

---

## Phase 3: Write The Findings

### Entry Criteria
- Routes chosen.

### Actions
1. `min_fix`: the smallest published version outside `vulnerable_range` (list versions with `npm view <name> versions --json`).
2. `fix_update_type`: semver class from `installed` to `min_fix` (0.x minor counts as major).
3. Merge into `<work_dir>/vulns.json` by (`ecosystem`, `name`, `advisory_id`).

### Output
`vuln_findings`.

### Quality Gate
- `<work_dir>/vulns.json` parses and every npm record has `min_fix` or `fix_route=no-fix`.

---

## Worked Example

Illustrative only. npm 10 app.

- Phase 1: `npm audit --omit=dev --json` shows 2 entries; full audit shows 7 (5 are dev-only build tooling).
- Phase 2: `vulnerabilities.cookie.via[0]` is an object (`GHSA-pxg6-pf52-xh8x`, range `<0.7.0`), `isDirect=false`. `npm explain cookie` shows `cookie@0.6.0` from `express@4.20.0`. `fixAvailable` is `{"name":"express","version":"4.21.1","isSemVerMajor":false}`, so `fix_route=parent-bump`, `via_direct=["express"]`.
- Phase 3: `min_fix` for cookie `0.7.0`; parent bump of express `4.20.0 -> 4.21.1` is a minor.

---

## Exit Criteria

DONE when `<work_dir>/vulns.json` holds every npm advisory carrier with exposure, path, route and minimum fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm audit` returns `ENOAUDIT` or 4xx from a private registry | **Adjust**: run the audit against the public registry only for public packages: `npm audit --registry=https://registry.npmjs.org/`; record private packages as unscanned. |
| Phase 1 | `npm audit signatures` reports invalid | **Stop**: report the package and version; do not proceed with upgrades of that package. |
| Phase 2 | Report uses old npm 6 `advisories` shape | **Adjust**: rerun with a current npm through `npx npm@10 audit --json`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
