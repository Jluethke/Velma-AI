# Python Deprecation Warning Sweep

**One-line description:** Surfaces every `DeprecationWarning`, `PendingDeprecationWarning` and library-specific deprecation class (for example `RemovedInDjango60Warning`, SQLAlchemy `MovedIn20Warning`) raised by the test suite on the CURRENT versions, fixes the ones raised by project code, and then locks them in with pytest `filterwarnings` so they cannot return.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `test_command`, `repo_path`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `deprecation_warning_count`, `deprecation_warnings_file`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`. Packages with major items are fixed first.

---

## Outputs

- `deprecation_report` (object): `before_count`, `after_count`, `fixed` (warning, file:line, commit), `third_party` (warnings raised inside site-packages, with the owning package), `escalated_filters` (lines added to pytest config). Also written to `<work_dir>/deprecations-py.json`.

---

## Phase 1: Capture Warnings With Their Origin

### Entry Criteria
- `upgrade_scope.stack == "python"`; baseline tests ran.

### Actions
1. Run the suite with warnings shown once per location and the summary printed:
   - pytest: `pytest -W default::DeprecationWarning -W default::PendingDeprecationWarning -rw -p no:cacheprovider > .dep-upgrade/py-warn.log 2>&1`. The "warnings summary" section lists each warning with `file:line` and a count.
   - Django runner: `python -Wa manage.py test > .dep-upgrade/py-warn.log 2>&1` (Django's upgrade guide recommends `-Wa` to show all deprecation warnings).
   - Plain scripts: `python -X dev -W default <entrypoint>` (`-X dev` enables default warning display).
2. SQLAlchemy 1.4 projects heading to 2.0: also run with `SQLALCHEMY_WARN_20=1` set, which enables `RemovedIn20Warning` output.
3. Split warnings by origin path: lines whose `file` is under the repo (not `site-packages`, `.venv`, `dist-packages`) are `project`; others are `third_party` with the package name taken from the path segment after `site-packages/`.

### Output
`py-warn.log` and warnings split into project and third-party.

### Quality Gate
- The log contains a `warnings summary` section (pytest) or the runner's warning lines, and the split lists are saved.

---

## Phase 2: Fix Project Warnings One At A Time

### Entry Criteria
- Project warnings list exists.

### Actions
1. Order project warnings: first those whose deprecated API belongs to a package with a `major` plan item, then by count descending.
2. For each warning, read the message; it nearly always names the replacement (for example `datetime.datetime.utcnow() is deprecated ... use timezone-aware objects ... datetime.datetime.now(datetime.UTC)`). If it does not, look up the symbol in the library's docs or the `breaking_changes` record. Do not guess a replacement API.
3. Apply automated fixers where they exist, each as its own commit and only on the warning they fix:
   - `pyupgrade --py310-plus <files>` (set the flag to the project's minimum Python) or `ruff check --select UP --fix <files>`.
   - Django: `django-upgrade --target-version <current-major.minor> <files>` (fixes deprecations already present in the current version).
4. Hand-fix the rest. Change only the lines that raise the warning. One warning type per commit: `git commit -m "fix: replace <old> with <new> (deprecation)"`.
5. After each commit run the full `test_command`; failures beyond baseline mean the replacement changed behavior: revert the commit and record it.

### Output
Fix commits.

### Quality Gate
- After the last commit, rerun Phase 1 step 1: the project warning count is lower than `before_count` and no new warning type appeared.
- Test failures equal the baseline.

---

## Phase 3: Escalate Fixed Warnings To Errors

### Entry Criteria
- Project warnings fixed or recorded.

### Actions
1. In the pytest config that already exists (`pytest.ini`, `pyproject.toml [tool.pytest.ini_options]`, or `setup.cfg [tool:pytest]`), add a `filterwarnings` entry per fixed warning class and module, for example `error::DeprecationWarning:myproject.*` or `error::django.utils.deprecation.RemovedInDjango60Warning`. Filters are evaluated with later entries taking precedence, so add new lines at the end.
2. Do not add `ignore::DeprecationWarning` to hide third-party warnings globally. For a third-party warning the project cannot fix, add a narrow `ignore:<message regex>:DeprecationWarning:<module>` line only with a comment naming the package and the plan item that removes it.
3. Run the suite again; it must pass with the new filters.
4. Write `<work_dir>/deprecations-py.json`.

### Output
`deprecation_report`.

### Quality Gate
- `pytest -q` passes with the new `filterwarnings` lines, and `git diff` of the config shows only added lines.
- `after_count` comes from a fresh run of Phase 1 step 1, not from arithmetic.

---

## Worked Example

Illustrative only. Django 4.2 app on Python 3.12, plan item: Django 5.2.

- Phase 1: `python -Wa manage.py test` shows `RemovedInDjango50Warning: The default value of USE_TZ will change from False to True in Django 5.0` from `django/conf/__init__.py`, triggered by `config/settings.py`; and `DeprecationWarning: datetime.datetime.utcnow() is deprecated` from `billing/tasks.py:31`. Third party: `DeprecationWarning` from `site-packages/rest_framework/...`.
- Phase 2: commit 1 sets `USE_TZ = True` explicitly after the user confirms timezone-aware handling (behavior change); commit 2 replaces `datetime.utcnow()` with `datetime.now(timezone.utc)` in `billing/tasks.py`. Tests equal baseline after each.
- Phase 3: `filterwarnings = ["error::DeprecationWarning:billing.*"]` added; suite passes. `before_count=9`, `after_count=3` (all third-party, from `djangorestframework`, fixed by its own plan item).

---

## Exit Criteria

DONE when project-raised deprecation warnings are fixed or recorded, the fixed classes are escalated to errors, and third-party warnings are mapped to their packages.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Warnings are swallowed by an existing `ignore` filter | **Adjust**: pass `-W default::DeprecationWarning` on the command line (pytest applies command-line `-W` after ini `filterwarnings`, so it wins); if the configured addopts contain `-p no:warnings`, override with `-o addopts=""` for this run; record the hiding filter. |
| Phase 2 | Replacement changes behavior (tests fail) | **Return**: revert that commit; record the warning as needing a design decision. |
| Phase 2 | Fix would touch more than the warning's own call sites | **Stop**: keep the diff to the call sites; larger refactors are out of scope. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
