# Changelog And Migration Guide Triage

**One-line description:** For every planned version jump, reads every release note between the current and target version (not only the target's), extracts breaking changes, removals, runtime floor changes and available codemods, and greps the repository to mark which ones actually touch this code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `repo_path`, `upgrade_goal`, `target_packages`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `deprecation_warnings_file` to cross-reference warnings already firing.

---

## Outputs

- `breaking_changes` (object[]): One record per (package, change): `ecosystem`, `name`, `from`, `to`, `introduced_in` (exact version), `change` (one sentence quoted or closely paraphrased from the source), `source_url`, `category` (`removed-api`, `renamed-api`, `behavior-change`, `default-change`, `runtime-floor`, `config-change`, `peer-change`), `affects_repo` (bool), `evidence` (file:line hits or the grep that found none), `codemod` (command or null), `warning_already_firing` (bool). Also written to `<work_dir>/breaking_changes.json`.

---

## Phase 1: Choose What To Read

### Entry Criteria
- `<work_dir>/outdated.json` and/or `<work_dir>/vulns.json` exist. If neither exists and `target_packages` is empty, stop: there is nothing to triage.

### Actions
1. Build the read list:

| upgrade_goal | Records to triage | Target version |
|---|---|---|
| `security-only` | every `vulns.json` record | `min_fix` |
| `minor-patch` | `outdated.json` records with `update_type` patch or minor | `wanted` |
| `framework-major`, `node-lts` | records in `target_packages` plus their `peer_group` | `latest` (or the user's target) |
| `all` | every record | `latest` |

2. Skip reading for `patch` updates of packages that follow semver and have a CHANGELOG with no "breaking" entry in that range; still list them with `affects_repo=false` and `change="patch, no breaking entries"` after a keyword search (Phase 2 step 3).

### Output
Read list with from/to versions.

### Quality Gate
- Every record in the read list has a concrete `from` and `to` version.

---

## Phase 2: Find And Read The Sources

### Entry Criteria
- Read list exists.

### Actions
1. Find the source repository and docs for each package:
   - PyPI: `curl -s https://pypi.org/pypi/<name>/json | python -c "import json,sys; print(json.load(sys.stdin)['info']['project_urls'])"`.
   - npm: `npm view <name> repository.url homepage bugs.url`.
   - Go: the module path is usually the repo; `https://pkg.go.dev/<module>?tab=versions`.
   - crates.io: `cargo info <name>` shows `repository` and `documentation`.
   - Maven: the artifact POM `<scm>` element, or the project site.
2. Read in this order and record each URL used:
   1. Official migration or upgrade guide for the target major (for example Django "release notes" per version, React "React 19 Upgrade Guide", Spring Boot "Spring Boot 3.0 Migration Guide" wiki page, Node.js "Notable changes" in each major's changelog).
   2. GitHub releases: `gh release list -R <owner>/<repo> --limit 100` then `gh release view <tag> -R <owner>/<repo>` for every tag in (`from`, `to`].
   3. The repo's `CHANGELOG.md`, `CHANGES.rst`, `HISTORY.md` or `NEWS` at the target tag: `gh api repos/<owner>/<repo>/contents/CHANGELOG.md?ref=<tag> --jq .content | base64 -d`.
   4. For Go modules without notes: `git log --oneline <from>..<to>` in a clone, and the `Deprecated:` comments on pkg.go.dev.
3. Read every version in the range, not just the target. Breaking changes for a removal usually appear as a deprecation two or more versions earlier. Search each document for: `BREAKING`, `Breaking`, `backwards incompatible`, `backward-incompatible`, `removed`, `Removed`, `deprecated`, `no longer`, `renamed`, `drop support`, `dropped support`, `minimum`, `requires Python`, `engines`, `MSRV`, `rust-version`, `default changed`, `now defaults`, `migration`, `codemod`.
4. For each hit write one record with `introduced_in` and `category`. Do not summarize from memory; every `change` has a `source_url`.

### Output
Draft `breaking_changes` records.

### Quality Gate
- Every record has a `source_url` that returns HTTP 200 (`curl -sI <url> | head -1`).
- Every version in each range was opened (list the tags read in `<work_dir>/changelog-read.txt`).

---

## Phase 3: Check Each Change Against This Repo

### Entry Criteria
- Draft records exist.

### Actions
1. For each `removed-api`, `renamed-api` or `config-change`, grep the exact symbol or key: `git -C <repo_path> grep -n -w '<symbol>' -- ':!*.lock' ':!.dep-upgrade'`. Include config files (`settings.py`, `application.yml`, `tsconfig.json`, `.babelrc`).
2. `affects_repo=true` when the grep hits non-vendored source; copy up to the first 20 hits into `evidence` and the total count.
3. For `behavior-change` and `default-change`, grep for the call site and mark `affects_repo=true` if it is used; these need a test that pins the behavior, noted for the apply step.
4. For `runtime-floor`, compare to `upgrade_scope.runtime_version`; mark `affects_repo=true` if the floor is above it.
5. Cross-reference `baseline_report.deprecation_warnings_file`: if the deprecated symbol appears there, set `warning_already_firing=true`.
6. Record `codemod` only when the migration guide or tool docs name one (for example `npx codemod@latest react/19/migration-recipe`, `django-upgrade --target-version 5.2`, OpenRewrite recipe `org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0`, `bump-pydantic`). Never invent a codemod name.
7. Write `<work_dir>/breaking_changes.json`.

### Output
`breaking_changes`.

### Quality Gate
- Every `affects_repo` value is backed by a grep command and its result in `evidence`.
- Every non-null `codemod` appears in the cited `source_url` text.

---

## Worked Example

Illustrative only. `requests 2.31.0 -> 2.32.3`, `django 4.2.16 -> 5.2.7`.

- Phase 1: goal `framework-major`, targets `django`. Read list: django 4.2.16 to 5.2.7.
- Phase 2: read Django 5.0, 5.1 and 5.2 release notes, each "Features removed" and "Backwards incompatible changes" section. Hit: 5.0 removes `django.utils.timezone.utc` (category `removed-api`, `introduced_in=5.0`); 5.1 removes the `DEFAULT_FILE_STORAGE` and `STATICFILES_STORAGE` settings in favor of `STORAGES` (category `config-change`).
- Phase 3: `git grep -n -w 'timezone.utc'` prints `billing/models.py:14`. `git grep -n 'DEFAULT_FILE_STORAGE'` prints `config/settings.py:88`. Both `affects_repo=true`. `codemod=django-upgrade --target-version 5.2` (its docs list the `timezone.utc` fixer). Baseline log already shows `RemovedInDjango50Warning` for the storage setting, so `warning_already_firing=true`.

---

## Exit Criteria

DONE when every planned jump has its breaking changes listed with sources, repo evidence, and any documented codemod.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | No changelog or release notes exist | **Return**: record `change="no release notes"`, `category=behavior-change`, `affects_repo=true`; the apply step must rely on the full test suite. |
| Phase 2 | GitHub API rate limit | **Retry**: after `gh auth status` confirms login; authenticated limits are higher. |
| Phase 3 | Symbol is too generic to grep (for example `get`) | **Adjust**: grep the qualified form (`module.get`, import line) and record the pattern used. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
