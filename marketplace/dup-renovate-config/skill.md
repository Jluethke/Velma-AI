# Renovate Configuration For Ongoing Upgrades

**One-line description:** Writes a validated `renovate.json` that keeps dependencies current in the same shape as the manual plan: majors separate and unautomerged, lockstep groups grouped, patch and minor grouped on a schedule, release-age delay, lockfile maintenance, and vulnerability PRs that bypass the schedule.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `stack`, `package_manager`, `manifest_files`, `repo_path`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Confirms which CI checks exist (automerge requires a required status check).
- `upgrade_plan` (object[], optional): From `dup-upgrade-order-plan`. Lockstep groups become `packageRules` groups. When absent, groups come from the outdated inventory or the user.

---

## Outputs

- `bot_config` (object): `bot` (`renovate`), `file` (path), `config` (the JSON), `validator_output`, `decisions` (each user choice with its value), `commit`. Also written to `<work_dir>/bot-renovate.json`.

---

## Phase 1: Collect Decisions

### Entry Criteria
- `upgrade_scope.bot == "renovate"`. No existing Renovate config, or the user asked to replace it: check `renovate.json`, `renovate.json5`, `.github/renovate.json`, `.renovaterc`, `.renovaterc.json`, `.gitlab/renovate.json`, and the `renovate` key in `package.json`. If one exists, edit that file, never add a second.

### Actions
1. Ask the user for each value below; do not pick numbers for them. Record answers in `decisions`:

| Decision | Config key | Notes |
|---|---|---|
| When PRs open | `schedule` | Renovate syntax, for example `["before 6am on monday"]`; vulnerability PRs ignore the schedule by default |
| Timezone | `timezone` | IANA name, for example `America/Chicago` |
| Delay after release | `minimumReleaseAge` | for example `"3 days"`; protects against yanked or malicious releases; value is the user's choice |
| Concurrent PR cap | `prConcurrentLimit`, `prHourlyLimit` | user values or the preset defaults |
| Automerge scope | `packageRules[].automerge` | only when the repo has required CI checks; never for majors |
| Range strategy | `rangeStrategy` | `auto` (default), `pin`, `bump`, `replace`, `widen` |

2. Confirm the repo has required CI checks for automerge: ask the user, or read branch protection with `gh api repos/<owner>/<repo>/branches/<default>/protection --jq .required_status_checks` (needs admin rights). If none, automerge stays off.

### Output
`decisions`.

### Quality Gate
- Every row in the table has a recorded value or "default" chosen by the user.

---

## Phase 2: Write The Config

### Entry Criteria
- Decisions recorded.

### Actions
1. Write `renovate.json` at the repo root (or `.github/renovate.json`) with this structure, filling values from `decisions`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "timezone": "<decision>",
  "schedule": ["<decision>"],
  "minimumReleaseAge": "<decision>",
  "dependencyDashboard": true,
  "lockFileMaintenance": { "enabled": true, "schedule": ["<decision>"] },
  "osvVulnerabilityAlerts": true,
  "packageRules": [
    { "matchUpdateTypes": ["major"], "dependencyDashboardApproval": true, "automerge": false },
    { "matchUpdateTypes": ["minor", "patch"], "matchCurrentVersion": "!/^0/", "groupName": "non-major dependencies" },
    { "groupName": "<lockstep group name>", "matchPackageNames": ["<pkg a>", "<pkg b>"] }
  ]
}
```

2. One `packageRules` entry per lockstep group from `upgrade_plan` (for example `react`, `react-dom`, `@types/react`, `@types/react-dom`). Regex patterns go inside `matchPackageNames` as `"/^@types\\//"`; `matchPackagePatterns` is deprecated in current Renovate versions.
3. `0.x` packages are excluded from the non-major group by `matchCurrentVersion: "!/^0/"` because their minors can break.
4. Go: add `"postUpdateOptions": ["gomodTidy"]` so Renovate runs `go mod tidy`. npm with peer groups: nothing extra; the group keeps them together.
5. Use `config:recommended` (the former name `config:base` is deprecated).

### Output
Config file.

### Quality Gate
- `python -m json.tool renovate.json` exits 0.

---

## Phase 3: Validate And Commit

### Entry Criteria
- Config parses.

### Actions
1. Run Renovate's validator: `npx --yes --package renovate -- renovate-config-validator renovate.json` (prints `Config validated successfully` on success; otherwise lists errors and migration warnings). Save output as `validator_output`.
2. Fix every error and every "config migration" warning, then rerun.
3. Commit alone: `git add renovate.json && git commit -m "ci: add Renovate configuration"`.
4. After merge, the user installs the Renovate GitHub App (or self-hosted runner); the first PR is the onboarding PR if no config exists on the default branch, and the Dependency Dashboard issue appears.

### Output
`bot_config`.

### Quality Gate
- The validator output contains `Config validated successfully` (or the installed version's success line) and no warnings.

---

## Worked Example

Illustrative only. npm repo with React lockstep group; user decisions: schedule `before 6am on monday`, timezone `America/Chicago`, `minimumReleaseAge` `"3 days"`, no automerge (no required checks).

- Phase 1: no existing config; branch protection API shows `required_status_checks: null`, so automerge off.
- Phase 2: config written with a `react` group rule matching `react`, `react-dom`, `/^@types\/react/`.
- Phase 3: first validator run warns that `matchPackagePatterns` is deprecated (copied from an old example); replaced with a regex inside `matchPackageNames`; second run prints `Config validated successfully`. Commit `4e2b8d9`.

---

## Exit Criteria

DONE when one Renovate config exists, it validates cleanly, majors require dashboard approval, lockstep groups are grouped, and every numeric value came from the user.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo already has Dependabot version updates configured | **Stop**: ask which bot to keep; two bots open duplicate PRs. |
| Phase 2 | User wants automerge without required checks | **Return**: explain automerge then merges untested; record the decision only if they confirm in writing. |
| Phase 3 | `npx renovate` download blocked | **Adjust**: validate against the JSON schema with `npx --yes ajv-cli validate` only if the user approves; record it is a weaker check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
