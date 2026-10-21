# Simulation Regression Suite in GitLab CI

**One-line description:** Writes a `.gitlab-ci.yml` that runs every library scenario as a parallel matrix job on a GPU-enabled GitLab Runner, starts CARLA or Gazebo headless per job, publishes JUnit reports to merge requests, and fails the pipeline on any KPI failure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scenario_library` (object[], required): Library from `vsim-fault-scenario-library`.
- `kpi_report` (object[], required): Local reference KPI report from `vsim-scenario-kpis`.
- `stack` (string, required): "carla" or "gazebo".

---

## Outputs

- `ci_workflow_file` (string): Path to `.gitlab-ci.yml`, plus the runner tags and runner `config.toml` settings it needs.

---

## Phase 1: GPU Runner

### Entry Criteria
- A Linux host with an NVIDIA GPU, Docker and the NVIDIA Container Toolkit.

### Actions
1. Register a runner with the Docker executor and tag `gpu` (`gitlab-runner register`, follow the prompts; tags are set there or in the project's runner settings).
2. In `/etc/gitlab-runner/config.toml`, under that runner's `[runners.docker]`, set `gpus = "all"`. Restart: `sudo gitlab-runner restart`.
3. For CARLA in a sibling container, the job needs Docker access: either mount the host socket (`volumes = ["/var/run/docker.sock:/var/run/docker.sock"]`) or use the `carlasim/carla` image as a `services:` entry with its own command. Pick one and record it. Mounting the socket gives jobs control of host Docker; use it only on a dedicated runner.
4. Confirm: a test job with `script: nvidia-smi` on tag `gpu` prints the GPU.
5. Reuse the repository scripts from the GitHub flow pattern: `ci/start_sim.sh`, `ci/run_scenario.sh <id>`, `ci/kpis.py`, `ci/stop_sim.sh`. Verify them locally against `kpi_report` first.

### Output
GPU runner tagged `gpu`.

### Quality Gate
- The `nvidia-smi` test job log shows the GPU table.
- Local `ci/kpis.py` reproduces `kpi_report`.

---

## Phase 2: Write the Pipeline

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Write `.gitlab-ci.yml`:
```yaml
stages: [sim]
scenario:
  stage: sim
  tags: [gpu]
  image: <image with python, carla client or ros+gz>
  timeout: <user value>
  parallel:
    matrix:
      - SCENARIO_ID: [<id1>, <id2>, <id3>]
  script:
    - ci/start_sim.sh
    - ci/run_scenario.sh "$SCENARIO_ID"
    - python3 ci/kpis.py "results/$SCENARIO_ID"
  after_script:
    - ci/stop_sim.sh
  artifacts:
    when: always
    paths: [results/$SCENARIO_ID/]
    reports:
      junit: results/$SCENARIO_ID/*.xml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```
2. Generate the `SCENARIO_ID` list from `scenarios/library.yaml` with a small script and commit the result; or use a parent job that writes a child pipeline YAML and triggers it (`trigger: include: artifact:`), per GitLab's dynamic child pipeline docs. Keep the list in sync: add a check script that fails if library ids and matrix ids differ.
3. `parallel:matrix` has a documented maximum job count per matrix; check the GitLab docs for your version and split into groups if the library is larger.
4. Limit concurrent GPU jobs with the runner's `concurrent` and `limit` settings in `config.toml` when one GPU serves all jobs.
5. Do NOT add `allow_failure: true` to the scenario job and do NOT drop failing ids from the matrix.

### Output
`ci_workflow_file`.

### Quality Gate
- CI Lint (project CI/CD Editor, Validate, or `glab ci lint`) reports the file valid.
- The sync check script passes: library ids equal matrix ids.

---

## Phase 3: Prove the Gate

### Entry Criteria
- File committed on a branch with an open merge request.

### Actions
1. Watch: `glab ci status` or the pipeline page. One job per `SCENARIO_ID` must appear.
2. Open the merge request's test report widget; JUnit cases from each job appear there.
3. Deliberately break one scenario on a throwaway branch, confirm its job fails with the KPI name in the log, then delete the branch.
4. Compare CI KPIs with `kpi_report` for unchanged scenarios; differences with the same seed are a runner determinism problem.

### Output
Verified pipeline.

### Quality Gate
- The deliberate failure produces a failed job; the rest pass.
- The MR test report lists cases from every job.

---

## Worked Example

Illustrative. `stack` = gazebo, 12 scenarios, one GPU.
```
$ glab ci lint
.gitlab-ci.yml is valid
$ glab ci status
(failed) scenario: [cutin-rural-003]
(passed) scenario: [lowfriction-ramp-001]
...
```
Job log for cutin-rural-003 ends with `min_ttc_s ... FAIL` from `ci/kpis.py`.

---

## Exit Criteria

DONE when every library scenario runs as its own GPU job, JUnit reports reach merge requests, KPI failures fail the pipeline, and the gate was shown to fail and pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `could not select device driver "" with capabilities: [[gpu]]` | **Adjust**: install the NVIDIA Container Toolkit and restart Docker. |
| Phase 2 | Matrix too large | **Adjust**: split into several matrix groups or a child pipeline. |
| Phase 3 | JUnit not shown | **Adjust**: the report path glob does not match; list `results/` in the job log. |
| Phase 3 | CI differs from local | **Return**: to the determinism flow for this runner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
