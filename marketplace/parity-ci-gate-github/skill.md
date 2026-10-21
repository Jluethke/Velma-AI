# Parity CI Gate on GitHub Actions

**One-line description:** Adds a GitHub Actions workflow that verifies golden hashes, builds the port with production floating-point flags on x86_64 and aarch64 runners, runs the parity comparison, uploads the report, and blocks merges on failure through a required status check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `parity_report` (object, required): Output of `parity-report`, showing the commands that produce a passing run locally.
- `comparison_policy` (object, required): Output of `parity-ulp-tolerance-policy`.
- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `port_repo` (string, required): Path to the port repository hosted on GitHub.

---

## Outputs

- `ci_workflow` (string): Path to `.github/workflows/parity.yml` and the name of the required status check.

---

## Phase 1: Write the Workflow

### Entry Criteria
- The parity run passes locally with the commands recorded in `parity_report`.

### Actions
1. Create `.github/workflows/parity.yml`:
   ```yaml
   name: parity
   on: [pull_request, push]
   jobs:
     parity:
       strategy:
         fail-fast: false
         matrix:
           os: [ubuntu-24.04, ubuntu-24.04-arm]
       runs-on: ${{ matrix.os }}
       steps:
         - uses: actions/checkout@v4
           with: { lfs: true }
         - run: cd golden && sha256sum -c golden.sha256
         - run: cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build build --target parity_harness
         - run: grep -c -- "-ffp-contract=off" build/compile_commands.json
         - run: python tests/parity/run_all.py --golden golden --policy tests/parity/policy.json --out parity_report.json
         - if: always()
           uses: actions/upload-artifact@v4
           with: { name: parity-${{ matrix.os }}, path: parity_report.json }
   ```
2. Check the GitHub documentation for the current list of hosted runner labels before using `ubuntu-24.04-arm`; availability of arm64 hosted runners depends on repository visibility and plan. If not available, use a self-hosted aarch64 runner with labels `[self-hosted, linux, arm64]`.
3. `fail-fast: false` keeps the x86_64 job running when aarch64 fails, so both results are visible.
4. Do NOT add `continue-on-error: true` to any parity step. Do NOT run the comparison in a step that ignores its exit code (for example `|| true`).
5. `run_all.py` must exit nonzero when the verdict is `FAIL`. Fields in report-only mode are printed but do not fail the job, as the policy says.
6. Commit `tests/parity/policy.json` as a copy of `comparison_policy`, and add it to CODEOWNERS with the goldens, so loosening a bound needs review.

### Output
Workflow file.

### Quality Gate
- `grep -n "continue-on-error\|| true" .github/workflows/parity.yml` returns nothing.
- `actionlint .github/workflows/parity.yml` (if installed) reports no errors.

---

## Phase 2: Prove the Gate Blocks

### Entry Criteria
- Workflow committed on a branch.

### Actions
1. Open a pull request with the workflow; confirm both matrix jobs run and pass.
2. Mutation check: on a throwaway branch, flip one bit in one port output path (for example change a constant in the port by one ULP using `std::nextafter`) and push. Both jobs must fail. Close that branch without merging.
3. In repository Settings, Branches, add a branch protection rule (or ruleset) for the default branch requiring the status checks `parity (ubuntu-24.04)` and `parity (ubuntu-24.04-arm)`. The exact check names appear in the pull request checks list; copy them from there.
4. Emit `ci_workflow` with the file path and the required check names.

### Output
`ci_workflow`.

### Quality Gate
- The mutation pull request shows both parity checks failed.
- The branch protection rule lists both check names as required.

---

## Worked Example

Illustrative.

```
parity (ubuntu-24.04)       pass   3m12s
parity (ubuntu-24.04-arm)   pass   3m40s
-- mutation branch --
parity (ubuntu-24.04)       fail   lowpass.step y mismatches=5832
parity (ubuntu-24.04-arm)   fail   lowpass.step y mismatches=5832
```

Both checks are then marked required on `main`.

---

## Exit Criteria

DONE when the workflow runs on both architectures, a deliberate one-ULP change fails it, and both checks are required for merge.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | LFS files arrive as pointer text | **Retry**: confirm `lfs: true` on checkout; the hash check then passes. |
| Phase 2 | Mutation branch passes | **Stop**: the job is not reading the comparison exit code; fix before requiring the check. |
| Phase 2 | No arm64 runner available | **Adjust**: use QEMU in the x86_64 job as a provisional check and record real hardware as an open item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
