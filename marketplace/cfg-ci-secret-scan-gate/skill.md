# CI Secret Scan Gate

**One-line description:** Adds a required CI job that scans the commits of every pull request and push with gitleaks (and optionally TruffleHog for verified results), with full-depth checkout so the commit range exists, actions pinned to tags or SHAs, redacted output, and a branch protection rule that blocks merge on failure, then proves the gate fails on a planted fake token.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `ci_platform` (string, required): `github-actions` or `gitlab-ci`.
- `allowlist_changes` (object[], optional): Reviewed allowlist entries from `cfg-triage-secret-findings`, so the gate does not fail on known non-secrets.

---

## Outputs

- `ci_scan_job` (object): Path of the CI file changed, job name, pinned versions, required-check status, and the failing and passing run URLs.

---

## Phase 1: Write The Job

### Entry Criteria
- `ci_platform` is one of the two values.
- History scan done (`cfg-gitleaks-scan-history`) and its findings triaged; otherwise the first run fails on old findings.

### Actions
1. GitHub Actions: create `.github/workflows/secret-scan.yml`:
```yaml
name: secret-scan
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<tag-or-sha>
        with:
          fetch-depth: 0
      - name: gitleaks
        run: |
          curl -sSfL -o gl.tar.gz "https://github.com/gitleaks/gitleaks/releases/download/${GL_VERSION}/gitleaks_${GL_VERSION#v}_linux_x64.tar.gz"
          echo "${GL_SHA256}  gl.tar.gz" | sha256sum -c -
          tar -xzf gl.tar.gz gitleaks
          ./gitleaks git --redact -v --log-opts="${{ github.event_name == 'pull_request' && format('{0}..{1}', github.event.pull_request.base.sha, github.event.pull_request.head.sha) || format('{0}..{1}', github.event.before, github.sha) }}" .
        env:
          GL_VERSION: v8.21.2
          GL_SHA256: <sha256 from the release's checksums file>
```
   - `fetch-depth: 0` is required; the default depth 1 has no base commit, so a range scan fails or scans nothing.
   - For pull requests the job scans only the PR's commits (`base..head`); for pushes to `main` it scans `before..sha`, the commits in that push. A full-history scan on every run re-reports triaged history. When `github.event.before` is all zeros (first push of a branch), the range is invalid; the job then fails loudly, which is the safe outcome; rerun with a full scan for that case.
   - Downloading the release binary and checking its SHA-256 against the release checksums avoids depending on `gitleaks/gitleaks-action`, which requires a license key (`GITLEAKS_LICENSE`) for repositories owned by organizations. If you use the action instead, pin it to a tag or SHA and set the license secret.
   - Check the release asset file name pattern on the releases page for your version; do not guess it.
2. Optional verified-secret job with TruffleHog (pin the action to a release tag, not `@main`):
```yaml
      - uses: trufflesecurity/trufflehog@<release tag>
        with:
          extra_args: --results=verified,unknown
```
   The action scans the pushed or PR commit range by default; read the action's README for the inputs your tag supports.
3. GitLab CI: include the managed template in `.gitlab-ci.yml`:
```yaml
include:
  - template: Jobs/Secret-Detection.gitlab-ci.yml
```
   It adds a `secret_detection` job in the `test` stage (which must exist in `stages:`). Check the GitLab docs for your tier's behavior on merge request pipelines and how findings fail or annotate the pipeline; on tiers where the job reports but does not fail, add a follow-up job that fails when the report contains findings.
4. Commit allowlist entries from `allowlist_changes` in the same change if provided.

### Output
CI file with the scan job.

### Quality Gate
- `actionlint .github/workflows/secret-scan.yml` exits 0 (GitHub), or the GitLab CI Lint tool (`glab ci lint`) reports valid.
- Every `uses:` line references a tag or 40-character SHA, not a branch (`rg -n 'uses: .*@(main|master)$' .github/workflows/` returns nothing).

---

## Phase 2: Prove The Gate Fails And Passes

### Entry Criteria
- Phase 1 gate passed and the workflow is on the default branch (or in the PR that adds it).

### Actions
1. Open a throwaway PR from branch `test/secret-gate` that adds a file with a fake GitHub token shape (`ghp_` plus 36 random alphanumerics, generated as in `cfg-precommit-gitleaks-hook`). Commit with `--no-verify` so the local hook does not stop it; that simulates a developer bypassing the hook.
2. Expected: job `gitleaks` fails, log shows `RuleID: github-pat` and `leaks found: 1`, and the secret is shown as `REDACTED`. Record the run URL.
3. If GitHub secret scanning push protection is enabled, the push itself may be blocked before CI runs; that is also a pass for the control. Record it and use a different rule shape for the CI test (for example a fake Slack webhook URL shape) only if needed.
4. Close the PR and delete the branch: `gh pr close <n> --delete-branch`. The commit still exists in the PR ref; the token is fake, so nothing needs rotating.
5. Open a second throwaway PR with a harmless change. Expected: job passes. Record the run URL, then close it.

### Output
Failing and passing run URLs.

### Quality Gate
- The fake-token run's conclusion is `failure` (`gh run view <id> --json conclusion -q .conclusion`).
- The harmless run's conclusion is `success`.
- The fake value does not appear in the failing log (`gh run view <id> --log | rg 'ghp_[A-Za-z0-9]{36}'` returns nothing).

---

## Phase 3: Make It Required

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. GitHub: add the job as a required status check on the default branch. With rulesets: Settings > Rules > Rulesets > Require status checks to pass, add `gitleaks`. With classic protection: Settings > Branches > branch protection rule > Require status checks. CLI equivalent through `gh api` exists; check the REST docs for the exact endpoint and payload rather than guessing.
2. GitLab: Settings > Merge requests > "Pipelines must succeed".
3. Enable GitHub secret scanning and push protection if the plan allows (Settings > Code security). Record status.
4. Record in `ci_scan_job`: file, job name, pinned versions, required-check status, run URLs.

### Output
`ci_scan_job`.

### Quality Gate
- The branch rules list the `gitleaks` check as required (`gh api repos/<org>/<repo>/rules/branches/main` output contains `gitleaks`, or a screenshot path of the settings page is recorded).

---

## Common Mistakes To Avoid

- Do not use `fetch-depth: 1` (the default) for a range scan.
- Do not pin actions to `@main` or `@master`.
- Do not print secrets: keep `--redact`.
- Do not add `continue-on-error: true` to get a green pipeline.
- Do not consider the gate done until it was seen failing.

---

## Worked Example

Illustrative. GitHub repo `acme/billing`, gitleaks v8.21.2 binary.

PR #214 with a fake token, committed with `--no-verify`:
```
$ gh run view 9123456789 --json conclusion -q .conclusion
failure
$ gh run view 9123456789 --log | rg 'RuleID|leaks found'
gitleaks  RuleID:      github-pat
gitleaks  WRN leaks found: 1
```
PR #215 harmless change: `success`. Ruleset "main protection" now requires `gitleaks`.

---

## Exit Criteria

DONE when a pinned, full-depth, redacted secret scan runs on every PR and push, it was seen failing on a fake token and passing on a clean change, and it is a required check for merging.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | First run fails on old history findings | **Return**: triage them with `cfg-triage-secret-findings`; do not widen the allowlist to pass. |
| Phase 1 | Checksum mismatch on download | **Stop**: do not run the binary; recheck the version and checksum file. |
| Phase 2 | Gate passes on the fake token | **Stop**: the range is empty (check `fetch-depth`) or the token shape does not match the rule; fix and rerun. |
| Phase 3 | No admin rights to set required checks | **Return**: ask a repository admin; record the request. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
