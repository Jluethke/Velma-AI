# Dependabot Configuration For Ongoing Upgrades

**One-line description:** Writes a `.github/dependabot.yml` (version 2) with one `updates` entry per ecosystem and directory, grouped minor and patch updates, ignored or separate majors, lockstep groups, and GitHub Actions updates, then validates it against the schema and confirms GitHub parsed it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `stack`, `package_manager`, `manifest_files`, `repo_path`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Confirms CI exists for Dependabot PRs.
- `upgrade_plan` (object[], optional): From `dup-upgrade-order-plan`. Lockstep groups become `groups` entries.

---

## Outputs

- `bot_config` (object): `bot` (`dependabot`), `file` (`.github/dependabot.yml`), `config` (YAML text), `validator_output`, `decisions`, `commit`. Also written to `<work_dir>/bot-dependabot.json`.

---

## Phase 1: Map Ecosystems And Collect Decisions

### Entry Criteria
- `upgrade_scope.bot == "dependabot"`. If `.github/dependabot.yml` exists, edit it; never create `dependabot.yaml` beside it.

### Actions
1. Map each manifest directory to a `package-ecosystem` value:

| Files | package-ecosystem |
|---|---|
| `requirements*.txt`, `pyproject.toml` with Poetry or pip, `Pipfile` | `pip` |
| `uv.lock` | `uv` (supported per current GitHub docs; confirm in the docs' ecosystem list) |
| `package.json` with npm, pnpm or yarn lock | `npm` |
| `go.mod` | `gomod` |
| `Cargo.toml` | `cargo` |
| `pom.xml` | `maven` |
| `build.gradle(.kts)` | `gradle` |
| `.github/workflows/*.yml` | `github-actions` (directory `/`) |
| `Dockerfile` | `docker` |

2. Find manifest directories: `git ls-files | grep -E '(^|/)(package.json|go.mod|Cargo.toml|pom.xml|pyproject.toml|requirements.txt)$' | xargs -n1 dirname | sort -u`. Use `directory: "/"` for the root or `directories: [...]` for several directories with one ecosystem.
3. Ask the user and record: `schedule.interval` (`daily`, `weekly`, `monthly`), optional `schedule.day` and `schedule.time` with `timezone`, `open-pull-requests-limit` (documented default 5), whether majors are ignored or opened as separate PRs, and any `cooldown` days (newer option; confirm it exists in the docs for their GitHub plan). Do not choose numbers for them.

### Output
Ecosystem map and `decisions`.

### Quality Gate
- Every manifest directory found in step 2 maps to exactly one ecosystem entry.

---

## Phase 2: Write The YAML

### Entry Criteria
- Decisions recorded.

### Actions
1. Write `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "<decision>"
    open-pull-requests-limit: <decision>
    groups:
      react:
        patterns: ["react", "react-dom", "@types/react", "@types/react-dom"]
      non-major:
        update-types: ["minor", "patch"]
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "<decision>"
```

2. Include the `ignore` majors block only if the user chose to ignore majors. If they want majors as separate PRs, omit it; ungrouped updates open one PR each.
3. Order of groups matters: a dependency joins the first group it matches, so list lockstep groups before the catch-all `non-major` group.
4. Security updates are enabled in repository settings (Dependabot alerts and security updates), not by this file. To group security PRs, add a group with `applies-to: security-updates`.
5. Private registries go under a top-level `registries:` key referencing secrets by name (`${{secrets.NAME}}`); never write a token into the file.

### Output
`.github/dependabot.yml`.

### Quality Gate
- `python -c "import yaml,sys; yaml.safe_load(open('.github/dependabot.yml'))"` exits 0 (PyYAML), or another YAML parser the project already has.

---

## Phase 3: Validate And Commit

### Entry Criteria
- YAML parses.

### Actions
1. Validate against the SchemaStore schema: `pipx run check-jsonschema --builtin-schema vendor.dependabot .github/dependabot.yml` (check `check-jsonschema --help` for the built-in schema list). Save output as `validator_output`.
2. Fix every reported error; rerun until it prints `ok -- validation done`.
3. Commit alone: `git add .github/dependabot.yml && git commit -m "ci: configure Dependabot version updates"`.
4. After it reaches the default branch, check GitHub parsed it: repository Insights, Dependency graph, Dependabot tab shows each ecosystem with its last check time, or a parse error. Record the result.

### Output
`bot_config`.

### Quality Gate
- `check-jsonschema` printed its success line.
- After merge, the Dependabot tab text for each configured ecosystem (last checked time or error message) is copied into `bot_config`; there is no error line.

---

## Worked Example

Illustrative only. Monorepo with `web/package.json`, `api/go.mod`, workflows. User: weekly, limit 5 (documented default), majors as separate PRs.

- Phase 1: map `web` to `npm`, `api` to `gomod`, root to `github-actions`.
- Phase 2: three `updates` entries; npm has groups `react` then `non-major`; no `ignore` block.
- Phase 3: first `check-jsonschema` run reports `'update-type' is not valid under any of the given schemas` (typo, should be `update-types`); fixed; second run prints `ok -- validation done`. Commit `11af7c3`.

---

## Exit Criteria

DONE when one Dependabot config covers every manifest directory and GitHub Actions, validates against the schema, uses only user-chosen values, and is committed alone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Renovate already configured | **Stop**: ask which bot to keep. |
| Phase 1 | Ecosystem not in Dependabot's supported list | **Return**: record it as uncovered; suggest Renovate if the user wants coverage. |
| Phase 3 | Schema validator unavailable | **Adjust**: rely on the GitHub Dependabot tab after merge and record that the pre-merge check was skipped. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
