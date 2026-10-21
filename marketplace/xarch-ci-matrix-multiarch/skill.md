# Set Up a Multi-Architecture CI Matrix

**One-line description:** Writes a CI workflow that builds and tests for x86-64 and aarch64 across a job matrix, choosing native aarch64 runners where available and QEMU emulation otherwise, and gates the merge on every matrix leg so an aarch64 regression cannot land green.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Path to the repository root where the workflow file is written.
- `arch_list` (string, required): The architectures to build, for example `amd64,arm64`.
- `ci_system` (string, optional): The CI provider. One of `github-actions`, `gitlab-ci`. If absent, default to `github-actions`.

---

## Outputs

- `ci_workflow` (string): Path to the written workflow file.
- `ci_report` (object): The matrix legs, the runner or emulation choice per leg, and the gating configuration.

---

## Phase 1: Choose Runner vs Emulation per Arch

### Entry Criteria
- `arch_list` lists at least one architecture.

### Actions
1. For each arch, choose how it runs with this table. Native is faster and models the target exactly; emulation needs no special runner but is slow:

| Arch | Preferred | Fallback |
|---|---|---|
| amd64 | native x86-64 runner | n/a |
| arm64 | native arm64 runner if the provider offers one | QEMU via the `tonistiigi/binfmt` setup, then build in an arm64 container |

2. For GitHub Actions, native arm64 runners exist as `ubuntu-24.04-arm` style labels on supported plans; otherwise emulate with `docker/setup-qemu-action` plus `docker/setup-buildx-action`. Record which path each leg takes.
3. The emulated leg must still run the test suite, not only the build. A build that compiles but fails its tests under emulation is the regression the matrix exists to catch.
4. Do not claim an arch is covered if its leg only builds and skips tests; record build-only legs explicitly as not test-covered.

### Output
The per-arch runner or emulation decision.

### Quality Gate
- Every arch in `arch_list` has a recorded runner-or-emulation choice.
- Each leg's plan includes a test step, or is explicitly marked build-only.

---

## Phase 2: Write the Workflow and Gate the Merge

### Entry Criteria
- The per-arch plan is decided.

### Actions
1. Write the workflow with a matrix over `arch_list`. For GitHub Actions, a sketch:

```
jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        arch: [amd64, arm64]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - if: matrix.arch == 'arm64'
        uses: docker/setup-qemu-action@v3
      - run: ./ci/build-and-test.sh ${{ matrix.arch }}
```

Set `fail-fast: false` so one arch failing does not cancel the others, which would hide a second failure.
2. Gate the merge on every leg. In branch protection, require the status check for each matrix leg (for example `build (amd64)` and `build (arm64)`). A matrix where only `amd64` is required lets an `arm64` break merge.
3. Pin action versions to a tag or SHA so the workflow is reproducible, and cache the toolchain and the QEMU setup between runs where the provider supports it.
4. Do not mark the emulated leg `continue-on-error: true` to get green; that silently drops aarch64 from the gate. If the emulated leg is flaky, fix the flake or move to a native runner, do not ignore it.
5. Do not delete or skip the aarch64 test step to make CI pass.

### Output
`ci_workflow`, `ci_report`.

### Quality Gate
- The workflow file has a matrix covering every arch in `arch_list` with `fail-fast: false`.
- `ci_report` states that each arch's status check is a required gate (no `continue-on-error` on the aarch64 leg).

---

## Worked Example

Illustrative. `project_dir` = `.`, `arch_list` = `amd64,arm64`, `ci_system` = `github-actions`.

- Phase 1: `amd64` runs on `ubuntu-latest` native; `arm64` emulates with `docker/setup-qemu-action` because no native arm64 runner is on the plan. Both legs run `build-and-test.sh`.
- Phase 2 writes `.github/workflows/multiarch.yml` with the matrix above and records that branch protection requires `build (amd64)` and `build (arm64)`.

```
$ ls .github/workflows/multiarch.yml
.github/workflows/multiarch.yml
```

`ci_report` = `{ "legs": [{"arch":"amd64","runner":"native"},{"arch":"arm64","runner":"qemu"}], "gated": ["build (amd64)", "build (arm64)"] }`.

---

## Exit Criteria

DONE when the workflow builds and tests every arch in `arch_list` with `fail-fast: false`, and every leg's check is a required merge gate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsure if native arm64 runners are available | **Adjust**: check the provider's current runner labels in its docs; default to QEMU emulation if unavailable. |
| Phase 2 | aarch64 leg is flaky | **Adjust**: stabilize the test or switch that leg to a native runner; do not set `continue-on-error`. |
| Phase 2 | Only amd64 is a required check | **Adjust**: add every matrix leg to branch protection so aarch64 gates the merge. |
| Phase 2 | Emulated leg times out | **Adjust**: cache the QEMU and toolchain setup and narrow the test scope on that leg, keeping tests present. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
