# Django Major Upgrade (LTS To LTS)

**One-line description:** Upgrades Django across feature releases (for example 4.2 LTS to 5.2 LTS) the way the Django docs recommend: clear deprecation warnings on the current version, move third-party apps to versions that support both, step through each feature release with `django-upgrade`, and prove migrations, system checks and tests at every step.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `runtime_version`, `test_command`, `work_dir`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`. The `framework-flow` item for Django and its `blocked_by` plugin items.
- `codemod_log` (object[], required): From `dup-codemod-run`. Confirms library codemods already landed so this flow starts from a green tree.
- `framework_target_version` (string, required): Target Django version, for example `5.2`.

---

## Outputs

- `framework_upgrade_log` (object): `from`, `to`, `steps` (each feature release with commits and results), `third_party_blockers`, `migrations_generated`, `check_deploy_result`, `final_test_result`. Also written to `<work_dir>/framework-django.json`.

---

## Phase 1: Preconditions On The Current Version

### Entry Criteria
- `upgrade_scope.framework == "django"`; tree clean; tests equal baseline.

### Actions
1. Record the current version: `python -m django --version`.
2. List the feature releases between current and target: for 4.2 to 5.2 that is 5.0, 5.1, 5.2. Read each one's release notes on docs.djangoproject.com: "Backwards incompatible changes" and "Features removed". These are already in `breaking_changes`; confirm nothing is missing.
3. Python support: read the target release's "Python compatibility" section and compare with `python --version`. If the current Python is not supported, stop: a Python upgrade comes first.
4. Run with all warnings shown: `python -Wa manage.py test` (or `pytest -W error::DeprecationWarning` scoped to Django's `RemovedInDjango*` classes). Every `RemovedInDjango<next>Warning` must be fixed before the first jump (`dup-py-deprecation-sweep` does this; confirm the count is zero).
5. Third-party apps: for every `django-*` and Django-dependent package in `INSTALLED_APPS` and requirements, read its PyPI classifiers (`Framework :: Django :: 5.2`) or `requires_dist`. Record apps whose newest release does not support the target as `third_party_blockers`.

### Output
Release list, Python compatibility check, blocker list.

### Quality Gate
- `python -Wa manage.py test 2>&1 | grep -c 'RemovedInDjango'` prints `0`.
- Every installed Django-dependent package has a recorded supported version or is in `third_party_blockers`.

---

## Phase 2: Step Through Each Feature Release

### Entry Criteria
- `third_party_blockers` is empty, or the user accepted a replacement for each.

### Actions
1. For each release `R` in order (5.0, then 5.1, then 5.2), do steps 2 to 7. Do not jump straight from 4.2 to 5.2 unless the warning count in Phase 1 was zero AND the user accepts a single larger diff.
2. Bump Django only, capped to release `R`. For R = 5.0: uv `uv add "django>=5.0,<5.1"`; poetry `poetry add django@~5.0`; pip-tools edit `requirements.in` to `django>=5.0,<5.1` then `pip-compile --upgrade-package django requirements.in`. Install with the frozen command.
3. Run the codemod for this release: `django-upgrade --target-version R $(git ls-files '*.py')`. Commit the version change and codemod output together: `git commit -am "deps: django -> R (django-upgrade)"`.
4. System checks: `python manage.py check` must print `System check identified no issues`.
5. Migrations: `python manage.py makemigrations --check --dry-run`. Output `No changes detected` is expected. Any proposed migration means a model behavior changed under the new version: show it to the user, and only after approval run `makemigrations` and commit it separately as a one-way change (it must be in `rollback_plan`).
6. Run the full test suite with `python -Wa`. Fix failures only at call sites named in the release notes; one fix commit per removed API.
7. Collect the next release's warnings now visible (`RemovedInDjango<R+1>Warning`) and fix them before the next step.

### Output
One or more commits per feature release.

### Quality Gate
- After each release: `python manage.py check` clean, `makemigrations --check --dry-run` prints `No changes detected` (or an approved migration commit exists), and test failures equal the baseline.

---

## Phase 3: Deployment Checks And Settings Review

### Entry Criteria
- `python -m django --version` prints the target.

### Actions
1. `python manage.py check --deploy` with production-like settings (`DJANGO_SETTINGS_MODULE=<prod settings>`); compare warnings with a run on the baseline tag. New warnings must be explained.
2. Review settings removed or changed across the range, for example `DEFAULT_FILE_STORAGE` and `STATICFILES_STORAGE` replaced by `STORAGES` (removed in 5.1), `USE_L10N` removed in 5.0, `USE_TZ` default changed to `True` in 5.0, `FORMS_URLFIELD_ASSUME_HTTPS` transitional setting (5.0) for `forms.URLField` scheme default. Grep each: `git grep -n '<SETTING>'`.
3. Migration plan sanity on a copy of the production schema if the user provides one: `python manage.py migrate --plan`.
4. Write `<work_dir>/framework-django.json`.

### Output
`framework_upgrade_log`.

### Quality Gate
- `check --deploy` output saved with each new warning explained.
- `git grep -nE 'DEFAULT_FILE_STORAGE|STATICFILES_STORAGE|USE_L10N'` prints nothing when the target is 5.1 or later.

---

## Worked Example

Illustrative only. Django 4.2.16 to 5.2.7 on Python 3.11 with `django-filter`, `djangorestframework`, `django-storages`.

- Phase 1: 5.2 supports Python 3.10 to 3.13; fine. Warnings: zero after the sweep. Classifiers: all three list `Framework :: Django :: 5.2` in their latest releases, and those versions also support 4.2, so they were bumped first as `bump` items.
- Phase 2: 5.0: `uv add "django>=5.0,<5.1"`; `django-upgrade --target-version 5.0` rewrites `timezone.utc` to `datetime.timezone.utc` in `billing/models.py`; check clean; `No changes detected`; tests pass. 5.1: `STORAGES` replaces `DEFAULT_FILE_STORAGE` in `config/settings.py` (manual, one commit). 5.2: tests pass.
- Phase 3: `check --deploy` shows the same 2 warnings as the baseline (HSTS settings handled by the proxy). Final: `5.2.7`.

---

## Exit Criteria

DONE when Django is at the target, each feature release step passed checks, migrations and tests, removed settings are gone, and any generated migration was approved and recorded as one-way.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Current Python unsupported by target | **Stop**: report the needed Python; runtime upgrade first. |
| Phase 1 | Third-party app has no compatible release | **Return**: list it as a blocker; the user chooses wait, replace, or fork. |
| Phase 2 | `makemigrations --check` proposes migrations | **Stop**: show the operations; proceed only with approval and a rollback entry. |
| Phase 2 | Tests fail on a documented behavior change | **Return**: record it for the user; do not change test expectations. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
