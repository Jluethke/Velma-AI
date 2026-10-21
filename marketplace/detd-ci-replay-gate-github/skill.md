# CI Replay Gate on GitHub Actions

**One-line description:** Adds a GitHub Actions workflow that, on every pull request, fetches the regression corpus through Git LFS, runs the bit-exact replay harness and the double-run check on each target architecture (including `ubuntu-24.04-arm` runners), compares outputs across architectures with `cmp`, uploads divergence reports on failure, and is made a required status check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `replay_harness` (object, required): Harness command and exit code meanings.
- `corpus_manifest` (object[], required): Corpus entries to run.
- `target_platforms` (string[], optional): Architectures that must agree. Default: `x86_64` only, recorded.

---

## Outputs

- `ci_workflow` (object): Path of `.github/workflows/replay-gate.yml`, job names, the required check names, and the mutation evidence.

---

## Phase 1: Write the Workflow

### Entry Criteria
- The harness runs locally on the corpus with exit 0.
- The repository is on GitHub with Actions enabled.

### Actions
1. Create `.github/workflows/replay-gate.yml` with `on: pull_request` and `on: push` to the main branch.
2. Job `replay` with `strategy.matrix.runner` listing `ubuntu-24.04` and, when `aarch64` is a target, `ubuntu-24.04-arm`. Set `fail-fast: false` so one architecture's failure does not cancel the other's report.
3. Steps:
   1. `actions/checkout@v4` with `lfs: true` (or a DVC pull step if the corpus uses DVC).
   2. Install the pinned toolchain (same compiler version or the same `requirements.txt` lock used for recordings).
   3. Build with the pinned float policy.
   4. Run the harness over the corpus in `regression` mode; write `divergence_report.json` and the canonical outputs to `out/`.
   5. Run the double-run check on one corpus entry.
   6. `actions/upload-artifact@v4` with `if: always()` uploading `out/` and the report, named per runner (artifact names must be unique per run).
4. Job `cross_arch` with `needs: replay`: download both artifacts with `actions/download-artifact@v4` and run `cmp` per entry between architectures. Exit non-zero on any difference.
5. Pin third-party actions to a full commit SHA for supply chain safety; keep the tag in a comment.
6. Set environment variables from the float policy (`OMP_NUM_THREADS=1` and others) at the job level.

### Output
Workflow file.

### Quality Gate
- `actionlint .github/workflows/replay-gate.yml` exits 0 (install from its GitHub releases), or the workflow passes GitHub's own syntax check on push.

---

## Phase 2: Make It Required

### Entry Criteria
- The workflow ran green once on a branch.

### Actions
1. In repository Settings, branch protection or a ruleset for the main branch, add `replay` (each matrix leg appears as a separate check, for example `replay (ubuntu-24.04)`) and `cross_arch` as required status checks.
2. Record the exact check names in `ci_workflow`.
3. Do not add `continue-on-error: true` to these jobs.

### Output
Required checks set.

### Quality Gate
- `gh api repos/<owner>/<repo>/branches/<branch>/protection` (or the rulesets API) lists the check names.

---

## Phase 3: Prove the Gate Blocks

### Entry Criteria
- Checks required.

### Actions
1. Open a draft pull request from a scratch branch that changes one comparison operator at a limit reached in the corpus.
2. Confirm `replay` fails, the artifact contains a divergence report naming the tick and field, and the merge button is blocked.
3. Close the pull request and delete the branch.

### Output
`ci_workflow` with links to the failing run.

### Quality Gate
- The failing run URL is recorded, and its log shows the harness exit 1.
- The scratch branch is deleted (`git ls-remote --heads origin <branch>` prints nothing).

---

## Worked Example

Illustrative only. Matrix `ubuntu-24.04` and `ubuntu-24.04-arm`, 65 corpus entries. Green run: both legs `65 identical`, `cross_arch` 65 `cmp` exit 0. Mutation PR: `replay (ubuntu-24.04)` fails with `drive_017 diverged at tick 431 outputs.speed_cap`; merge blocked.

---

## Exit Criteria

DONE when the workflow runs the harness on every target architecture, compares across architectures, uploads reports, is required, and a mutation PR is blocked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | LFS bandwidth quota exceeded | **Adjust**: cache the corpus with `actions/cache` keyed on the manifest hash, or move to DVC with an own remote. |
| Phase 1 | Arm runner not available for the repository plan | **Adjust**: use a self-hosted aarch64 runner, or QEMU user mode with the emulation recorded. |
| Phase 3 | Mutation PR passes | **Stop**: the gate is not running the harness on the corpus; fix before relying on it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
