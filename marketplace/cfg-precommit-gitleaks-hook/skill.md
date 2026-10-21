# Pre-commit Secret Scanning With Gitleaks

**One-line description:** Installs the gitleaks hook through the pre-commit framework pinned to a release tag, so staged changes are scanned before each commit, verifies the hook blocks a planted fake token and passes a clean commit, and documents the bypass paths (`--no-verify`, `SKIP=gitleaks`) that make a CI scan still necessary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `allowlist_changes` (object[], optional): Output of `cfg-triage-secret-findings`; reviewed allowlist entries to apply so the hook does not block on known non-secrets.

---

## Outputs

- `precommit_config` (object): Path of `.pre-commit-config.yaml`, pinned gitleaks `rev`, the hook entry the installed version runs, and the block and pass test outputs.

---

## Phase 1: Add The Hook

### Entry Criteria
- `pre-commit --version` prints a version. Install with `pipx install pre-commit` or `pip install pre-commit` (or `brew install pre-commit`).
- The repository has no existing hook manager that conflicts (`ls .husky lefthook.yml .lefthook.yml 2>/dev/null`). If Husky or Lefthook is used, see Error Handling.

### Actions
1. Find the latest gitleaks release tag: `gh release view --repo gitleaks/gitleaks --json tagName -q .tagName`, or read github.com/gitleaks/gitleaks/releases. Record it, for example `v8.21.2`.
2. Add to `.pre-commit-config.yaml` (create it, or append to `repos:` if it exists):
```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2   # the tag you recorded
    hooks:
      - id: gitleaks
```
   Pin `rev` to a tag, never a branch. `pre-commit autoupdate` moves tags forward later.
3. Apply reviewed `allowlist_changes` entries (`.gitleaksignore` lines, `.gitleaks.toml` path allowlists) in this same change if provided. The hook reads them from the repo root.
4. Install the git hook: `pre-commit install`. It prints `pre-commit installed at .git/hooks/pre-commit`. Every developer must run this once per clone; add it to the setup doc.

### Output
Config committed and hook installed locally.

### Quality Gate
- `pre-commit install` printed the installed path.
- `rev:` in `.pre-commit-config.yaml` matches a tag pattern `v8.x.y` (not `main` or `master`).

---

## Phase 2: Prove It Blocks And Passes

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Read what the hook runs for this version: open the hook definition with `pre-commit run gitleaks --verbose --files .pre-commit-config.yaml` and note the command line, or read `.pre-commit-hooks.yaml` in the gitleaks repository at your tag. Recent versions run `gitleaks git --pre-commit --redact --staged --verbose`; older v8 versions run `gitleaks protect --verbose --redact --staged`.
2. Block test on a throwaway branch: `git switch -c test/precommit-gitleaks`. Create `leak_test.txt` containing a fake GitHub token shape: `ghp_` followed by 36 random letters and digits (generate with `printf 'ghp_%s\n' "$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 36)" > leak_test.txt`). It matches the gitleaks `github-pat` rule format but is not a real token.
3. `git add leak_test.txt && git commit -m "test"`. Expected: the hook prints `Detect hardcoded secrets...Failed`, a finding with `RuleID: github-pat`, and the commit is not created (`git log -1` still shows the previous commit).
4. Clean up: `git restore --staged leak_test.txt && rm leak_test.txt`.
5. Pass test: make a harmless change (a comment line in a README) and commit. Expected: `Detect hardcoded secrets...Passed`. Then delete the branch: `git switch - && git branch -D test/precommit-gitleaks`.
6. Run on all files once: `pre-commit run gitleaks --all-files`. This scans current files, not history; history was covered by `cfg-gitleaks-scan-history`. Any finding here is in HEAD and must go to triage.

### Output
Block and pass evidence.

### Quality Gate
- The block test output contains `Failed` and the finding, and `git log -1 --format=%s` does not show `test`.
- The pass test output contains `Passed`.
- `pre-commit run gitleaks --all-files` exit code is recorded (0, or 1 with findings sent to triage).

---

## Phase 3: Document Bypass And Backstop

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Record the bypass paths, which any developer can use: `git commit --no-verify` skips all hooks; `SKIP=gitleaks git commit ...` skips this hook; a clone where `pre-commit install` was never run has no hook. A pre-commit hook is a convenience for honest mistakes, not a control.
2. Therefore require the CI gate (`cfg-ci-secret-scan-gate`) and, on GitHub, secret scanning push protection (repository Settings > Code security). Record in `precommit_config` which of these exist.
3. Add the setup line to the developer docs: `pipx install pre-commit && pre-commit install`.
4. If the hook blocks a true non-secret during normal work, the fix is a reviewed `.gitleaksignore` fingerprint or an inline `gitleaks:allow` comment on that line, never removing the hook.

### Output
`precommit_config`.

### Quality Gate
- `precommit_config` lists the CI gate status and push protection status (enabled, or an open item with an owner).

---

## Common Mistakes To Avoid

- Do not use a real secret for the block test.
- Do not pin `rev: main`.
- Do not treat the hook as the only protection; it is skippable.
- Do not run `pre-commit run --all-files` and assume history is clean.

---

## Worked Example

Illustrative. Repo `/srv/billing`, gitleaks tag `v8.21.2`.

```
$ pre-commit install
pre-commit installed at .git/hooks/pre-commit
$ git add leak_test.txt && git commit -m "test"
Detect hardcoded secrets.................................................Failed
- hook id: gitleaks
- exit code: 1
Finding:     REDACTED
RuleID:      github-pat
File:        leak_test.txt
Line:        1
WRN leaks found: 1
$ git log -1 --format=%s
add refund endpoint
$ git commit -am "docs: comment"
Detect hardcoded secrets.................................................Passed
```

---

## Exit Criteria

DONE when the hook is pinned to a gitleaks tag, it was shown to block a fake token and pass a clean commit, an all-files run is recorded, and bypass paths plus the CI backstop status are documented.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo uses Husky or Lefthook | **Adjust**: add a hook step running the same gitleaks command from Phase 2 step 1 (with a pinned gitleaks binary) instead of pre-commit; run the same block and pass tests. |
| Phase 1 | `core.hooksPath` is set | **Adjust**: `pre-commit install` refuses; check `git config core.hooksPath` and integrate with that directory or unset it with the team's agreement. |
| Phase 2 | Block test passes (no block) | **Stop**: the hook is not running; check `.git/hooks/pre-commit` exists and was installed by pre-commit. |
| Phase 2 | First run fails downloading the hook repo | **Retry**: network or proxy issue; pre-commit clones the repo once into its cache. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
