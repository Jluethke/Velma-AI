# Simulation Regression Suite in GitHub Actions

**One-line description:** Writes a GitHub Actions workflow that starts a headless CARLA server in Docker or a headless Gazebo server on a GPU self-hosted runner, runs every scenario in the library as a matrix job, computes KPIs, uploads JUnit and recorder artifacts, and fails the build on any KPI failure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scenario_library` (object[], required): Library from `vsim-fault-scenario-library` (`scenarios/library.yaml`).
- `kpi_report` (object[], required): A local KPI report from `vsim-scenario-kpis`, used as the reference run and to confirm the KPI script works before CI.
- `stack` (string, required): "carla" or "gazebo".

---

## Outputs

- `ci_workflow_file` (string): Path to `.github/workflows/sim-regression.yml`, plus the list of scripts it calls and the runner labels it needs.

---

## Phase 1: Runner and Entry Scripts

### Entry Criteria
- `kpi_report` was produced locally with the same scripts CI will call.

### Actions
1. GitHub-hosted runners have no GPU by default. Register a self-hosted Linux runner with an NVIDIA GPU, Docker and the NVIDIA Container Toolkit, with labels `self-hosted`, `linux`, `gpu` (Settings, Actions, Runners). Confirm on it: `docker run --rm --gpus all ubuntu nvidia-smi`.
2. Put CI logic in scripts in the repository, not inline YAML:
   - `ci/start_sim.sh` starts the simulator and waits until ready.
   - `ci/run_scenario.sh <id>` runs one library entry and writes `results/<id>/`.
   - `ci/kpis.py results/<id>` writes the KPI CSV and exits 1 on any FAIL.
3. Readiness check for `stack` == carla: loop a `python -c "import carla; c=carla.Client('localhost',2000); c.set_timeout(5); c.get_server_version()"` until it succeeds or a deadline (user-chosen, recorded) passes. For gazebo: loop `gz topic -l | grep -q /clock`.
4. Run the three scripts locally and confirm `ci/kpis.py` reproduces `kpi_report`.

### Output
Runner registered and entry scripts verified.

### Quality Gate
- Local run of `ci/kpis.py` on the reference results produces the same pass and fail set as `kpi_report`.

---

## Phase 2: Write the Workflow

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Generate the matrix from the library in a first job:
```yaml
jobs:
  list:
    runs-on: ubuntu-latest
    outputs:
      ids: ${{ steps.ids.outputs.ids }}
    steps:
      - uses: actions/checkout@v4
      - id: ids
        run: echo "ids=$(python3 -c 'import yaml,json;print(json.dumps([e["id"] for e in yaml.safe_load(open("scenarios/library.yaml"))]))')" >> "$GITHUB_OUTPUT"
  scenario:
    needs: list
    runs-on: [self-hosted, linux, gpu]
    timeout-minutes: <user value>
    strategy:
      fail-fast: false
      max-parallel: 1
      matrix:
        id: ${{ fromJson(needs.list.outputs.ids) }}
    steps:
      - uses: actions/checkout@v4
      - run: ci/start_sim.sh
      - run: ci/run_scenario.sh ${{ matrix.id }}
      - run: python3 ci/kpis.py results/${{ matrix.id }}
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: results-${{ matrix.id }}
          path: results/${{ matrix.id }}
      - if: always()
        run: ci/stop_sim.sh
```
2. `max-parallel: 1` when the runner has one GPU and one simulator port set; raise it only when each job gets its own ports and GPU memory allows.
3. CARLA `ci/start_sim.sh`: `docker run -d --name carla --rm --gpus all --net=host carlasim/carla:<version> /bin/bash ./CarlaUE4.sh -RenderOffScreen -carla-rpc-port=2000`. `ci/stop_sim.sh`: `docker stop carla`. Gazebo: `gz sim -s -r --headless-rendering <world> &`, stop with `pkill -f "gz sim"`.
4. Trigger on `pull_request` and on `push` to the main branch; add `concurrency: group: sim-${{ github.ref }}` with `cancel-in-progress: true` so stale runs stop.
5. Do NOT add `continue-on-error: true` to the KPI step, and do NOT delete failing scenarios from the library to get green.

### Output
`ci_workflow_file`.

### Quality Gate
- `actionlint .github/workflows/sim-regression.yml` prints no errors (install actionlint from its GitHub releases).
- The KPI step has no `continue-on-error`.

---

## Phase 3: Prove It Fails and Passes

### Entry Criteria
- Workflow committed on a branch.

### Actions
1. Push the branch and open a pull request. Watch with `gh run watch` or `gh run list --workflow sim-regression.yml`.
2. Confirm one matrix job per library id ran and artifacts uploaded (`gh run view <run-id>` lists jobs and artifacts).
3. Prove the gate works: on a throwaway branch, set one scenario's parameter so it is known to fail a KPI, push, and confirm the job fails with the KPI name in the log. Delete the throwaway branch after.
4. Compare the CI KPI set with the local `kpi_report`. Any difference with the same seeds is a determinism problem on the runner; report it.

### Output
Verified workflow.

### Quality Gate
- `gh run view` shows a failed job for the deliberately failing scenario and passing jobs for the rest.
- CI KPI results equal `kpi_report` for unchanged scenarios.

---

## Worked Example

Illustrative. `stack` = carla, 24 library entries.
```
$ gh run list --workflow sim-regression.yml --limit 2
completed  failure  sim: deliberate fail  test/ci-gate  pull_request  1234567
completed  success  sim regression        feature/acc   pull_request  1234501
$ gh run view 1234567 --log-failed | grep FAIL
cutin-highway-007,min_ttc_s,0.81,s,1.5,SRD-12 3.4,FAIL,4.10
```

---

## Exit Criteria

DONE when the workflow runs every library scenario on a GPU runner, uploads results, fails on any KPI failure, and has been shown to both fail and pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No GPU runner available | **Stop**: register a self-hosted GPU runner; hosted runners cannot render. |
| Phase 2 | Port conflict between parallel jobs | **Adjust**: set `max-parallel: 1` or give each job distinct ports. |
| Phase 3 | Simulator not ready before tests | **Adjust**: extend the readiness loop deadline and record the new value. |
| Phase 3 | CI results differ from local | **Return**: to the determinism flow for this runner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
