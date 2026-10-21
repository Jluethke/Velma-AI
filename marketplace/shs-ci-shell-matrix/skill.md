# CI Matrix for Shell Scripts

**One-line description:** Adds a GitHub Actions workflow that runs ShellCheck (pinned), `shfmt -d` and the bats-core suite on `ubuntu-latest` and `macos-latest`, plus an Alpine container job for busybox `/bin/sh`, checks out bats submodules, and proves the workflow fails when a check fails.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `target_platforms` (string[], required): Decides which matrix entries exist.
- `shellcheck_report` (object, required): From `shs-shellcheck-gate`; carries the ShellCheck version and severity.
- `bats_tests` (object, required): From `shs-bats-cli-tests`; carries the run command.

---

## Outputs

- `ci_workflow` (object): Workflow file path, matrix entries, tool versions pinned, a link or log excerpt of a passing run, and the deliberate-failure run result.

---

## Phase 1: Map Platforms to Jobs

### Entry Criteria
- `shellcheck_report` final exit code is 0 and `bats_tests` passes locally.

### Actions
1. Map each target to a job with this table:

| Target platform | CI job |
|---|---|
| Any glibc Linux | `runs-on: ubuntu-latest` |
| macOS | `runs-on: macos-latest` (BSD userland, `/bin/bash` 3.2) |
| Alpine / busybox | `runs-on: ubuntu-latest` with `container: alpine:3` |
| Windows Git Bash | `runs-on: windows-latest` with `shell: bash` (Git Bash) |
| Other (FreeBSD, AIX) | No hosted runner; record as an open question |

2. If the CI system is not GitHub Actions (GitLab CI, Jenkins), keep the same jobs and commands and translate the YAML; record which system.

### Output
Job list.

### Quality Gate
- Every platform in `target_platforms` maps to a job or an open question.

---

## Phase 2: Write the Workflow

### Entry Criteria
- Job list exists.

### Actions
1. Create `.github/workflows/shell.yml` (if a file of that name exists, pick a new name; do not overwrite):

```yaml
name: shell
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: ShellCheck
        run: |
          docker run --rm -v "$PWD":/mnt -w /mnt koalaman/shellcheck:vX.Y.Z -S style bin/*
      - name: shfmt
        run: |
          go install mvdan.cc/sh/v3/cmd/shfmt@vA.B.C
          "$(go env GOPATH)/bin/shfmt" -d .
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - name: bats
        run: test/bats/bin/bats -r test/
  alpine:
    runs-on: ubuntu-latest
    container: alpine:3
    steps:
      - run: apk add --no-cache bash git
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - run: test/bats/bin/bats -r test/
```

2. Replace `vX.Y.Z` with the ShellCheck version from `shellcheck_report` (the image tag format is `v0.10.0`; check available tags on Docker Hub) and `vA.B.C` with the shfmt version used locally. `ubuntu-latest` images ship a ShellCheck binary, but its version changes when the image updates; the pinned container avoids drift.
3. bats-core itself needs bash, so the Alpine job installs `bash`; the script under test still runs with its own shebang. If the script is POSIX, add a step `sh -n bin/<script>` to exercise busybox `sh` explicitly.
4. Use the `bats_tests` run command exactly; do not add `|| true` to any step.
5. Remove the `alpine` or `macos-latest` entries only when `target_platforms` does not include them.

### Output
Workflow file.

### Quality Gate
- The YAML parses: `python -c 'import yaml,sys; yaml.safe_load(open(sys.argv[1]))' .github/workflows/shell.yml` exits 0 (or use `actionlint` if installed).
- `grep -c '|| true' .github/workflows/shell.yml` prints `0`.

---

## Phase 3: Prove Pass and Fail

### Entry Criteria
- Workflow written, and the user has approved pushing a branch (do not push without approval).

### Actions
1. Push a branch, open the run (`gh run list --branch <branch>` then `gh run watch <id>`), and wait for all jobs. Record each job's conclusion.
2. Deliberate failure: on a throwaway branch, add an unquoted `$var` to the script, push, and confirm the `lint` job fails with SC2086. Delete the throwaway branch after.
3. If a job fails on the real branch, read its log (`gh run view <id> --log-failed`), fix the cause in the script or test, and rerun. Do NOT disable the job or mark it `continue-on-error`.

### Output
`ci_workflow`.

### Quality Gate
- All jobs on the real branch conclude `success`.
- The deliberate-failure run concluded `failure` in the `lint` job.

---

## Worked Example

Illustrative only.

Targets: Ubuntu 22.04, macOS 14, Alpine 3.20. Jobs: `lint`, `test (ubuntu-latest)`, `test (macos-latest)`, `alpine`.

```
$ gh run list --branch shs-ci --limit 1
completed  success  shell  shs-ci  push  9123456789
$ gh run view 9123456789 --json jobs -q '.jobs[] | "\(.name) \(.conclusion)"'
lint success
test (ubuntu-latest) success
test (macos-latest) success
alpine success
```
Deliberate failure branch: `lint failure` with `SC2086 (info): Double quote to prevent globbing and word splitting.`

---

## Exit Criteria

DONE when CI runs lint and tests on every reachable target userland, all pass on the real branch, and a deliberate defect makes CI fail.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Workflow file name already exists | **Adjust**: choose a new file name; never overwrite another workflow. |
| Phase 3 | macOS job fails, Linux passes | **Return**: send to `shs-gnu-bsd-portability`; a GNU-only flag or bash 4 feature is in use. |
| Phase 3 | Alpine job fails with "not found" for the script interpreter | **Adjust**: the shebang needs bash; install it in the job or convert the script to POSIX sh. |
| Phase 3 | No approval to push | **Stop**: report the workflow as written but unverified. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
