# Semantic Rewrite with Semgrep Autofix

**One-line description:** Encodes a behavior-preserving rewrite as a Semgrep rule with a `fix:` template, metavariables and `pattern-not` exclusions, proves it with `semgrep --test` annotated fixtures, previews with `--autofix --dryrun`, then applies per directory and commits each green batch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `codemod_spec` (object, required): Before and after examples, exclusions and scope, for example `{"before": "yaml.load(f, Loader=yaml.SafeLoader)", "after": "yaml.safe_load(f)", "scope": "app"}`.
- `semgrep_language` (string, required): Semgrep language id for `languages:`, for example `python`, `typescript`, `go`, `java`.

---

## Outputs

- `step_commits` (string[]): Rule commit (if kept) and one SHA per applied batch.
- `step_log` (object[]): Per batch: findings fixed, files changed, results, SHA.

---

## Phase 1: Write the Rule

### Entry Criteria
- `git status --porcelain` empty; `semgrep --version` works (install with `pip install semgrep` or `brew install semgrep`; on Windows use WSL or Docker `semgrep/semgrep`).

### Actions
1. Confirm equivalence from documentation: `yaml.safe_load(stream)` is documented by PyYAML as `load(stream, SafeLoader)`. Record the citation. No citation: stop.
2. Write `.refactor/rules/yaml-safe-load.yaml`:
```yaml
rules:
  - id: yaml-load-safeloader-to-safe-load
    languages: [python]
    severity: INFO
    message: Use yaml.safe_load, identical to yaml.load with SafeLoader
    patterns:
      - pattern: yaml.load($STREAM, Loader=yaml.SafeLoader)
      - pattern-not-inside: |
          def load(...):
            ...
    fix: yaml.safe_load($STREAM)
```
3. Key semantics to rely on (from semgrep.dev docs): `$X` metavariables bind one expression; `...` matches any sequence of arguments or statements; Semgrep resolves imports, so `yaml.load` also matches `from yaml import load` as `load(...)` in many languages; check the output in Phase 2 rather than assuming.
4. If the fix must keep comments or formatting the pattern spans, use `fix-regex:` only when the docs confirm it fits; prefer `fix:`.
5. Do NOT write a fix that changes behavior (error messages, defaults, logging). If the spec does, stop and return to the user.

### Output
Rule file with the citation recorded.

### Quality Gate
- `semgrep --validate --config .refactor/rules/yaml-safe-load.yaml` exits 0 (check `semgrep --help` for `--validate` in your version; else a dry scan with no errors).
- Equivalence citation recorded.

---

## Phase 2: Test the Rule

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create the test target next to the rule with the same base name: `.refactor/rules/yaml-safe-load.py`, annotated:
```python
import yaml
# ruleid: yaml-load-safeloader-to-safe-load
data = yaml.load(f, Loader=yaml.SafeLoader)
# ok: yaml-load-safeloader-to-safe-load
data = yaml.load(f, Loader=yaml.FullLoader)
# ok: yaml-load-safeloader-to-safe-load
data = yaml.safe_load(f)
```
2. Create the expected fix output `.refactor/rules/yaml-safe-load.fixed.py` with the `ruleid` line rewritten and others unchanged.
3. Run `semgrep --test .refactor/rules/`. It checks that `ruleid` lines match, `ok` lines do not, and that the fix output equals the `.fixed` file.
4. Add a fixture for every exclusion in `codemod_spec` and every false positive found in Phase 3; rerun.

### Output
Passing rule tests.

### Quality Gate
- `semgrep --test` reports all tests passed, including the fix test.

---

## Phase 3: Preview, Apply per Directory, Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Scan without changes: `semgrep --config .refactor/rules/yaml-safe-load.yaml --metrics=off app/`. Count findings.
2. Preview fixes: `semgrep --config .refactor/rules/yaml-safe-load.yaml --metrics=off --autofix --dryrun app/`. Read each proposed change.
3. Apply one directory: `semgrep --config .refactor/rules/yaml-safe-load.yaml --metrics=off --autofix app/config/`.
4. Format changed files with the project formatter, then run build or typecheck, characterization tests, `test_command`, and the API check.
5. Green: `git commit -am "refactor(semgrep): yaml.load SafeLoader to safe_load in app/config"`. Red: `git checkout -- app/config`, add the failing site as an `ok:` fixture or tighten the rule, rerun Phase 2.
6. After all directories, rerun step 1: zero findings.
7. Optional guard: if the project runs Semgrep in CI, add the rule to its config in a separate `build:` commit so the old form does not return.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Final scan shows 0 findings in scope.
- Each batch commit passes build, tests and API check.
- `git status --porcelain` empty.

---

## Worked Example

Illustrative only.
```
$ semgrep --test .refactor/rules/
1/1: all unit tests passed
1/1: all fix tests passed
$ semgrep --config .refactor/rules/yaml-safe-load.yaml --metrics=off app/
Ran 1 rule on 214 files: 6 findings.
$ semgrep --config .refactor/rules/yaml-safe-load.yaml --metrics=off --autofix app/config/
$ pytest -q
215 passed, 2 skipped
```

---

## Exit Criteria

DONE when the rule is tested with annotated and fix fixtures, every finding in scope is rewritten in green per-directory commits, and a final scan finds nothing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rule fails to parse | **Adjust**: read the error's line and column; check pattern syntax in the semgrep.dev rule syntax page. |
| Phase 2 | Fix test fails | **Adjust**: compare the produced and expected files; fix the `fix:` template. |
| Phase 3 | Semgrep matches a shadowed or redefined name | **Adjust**: add a `pattern-not-inside` and an `ok:` fixture. |
| Phase 3 | Tests fail after a batch | **Retry**: revert the directory and tighten the rule. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
