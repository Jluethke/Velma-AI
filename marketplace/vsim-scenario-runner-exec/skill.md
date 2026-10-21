# Run a Scenario Library with CARLA scenario_runner

**One-line description:** Runs every entry of a scenario library through CARLA's scenario_runner in synchronous mode with a fixed Traffic Manager seed, writing JUnit and JSON results plus a CARLA recorder file per scenario, and separates scenario failures from infrastructure failures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scenario_library` (object[], required): Entries from `vsim-fault-scenario-library` with file, seed and KPIs.
- `carla_server_cmd` (string, required): Server command from `vsim-carla-server-setup`.
- `sim_seed` (integer, required): Seed used in the determinism check; used to confirm the determinism verdict applies.
- `determinism_report` (object, required): From `vsim-carla-seed-determinism`; must be "DETERMINISTIC" for regression results to be comparable across runs.

---

## Outputs

- `scenario_results` (object[]): Per scenario id: exit status, scenario_runner criteria results (name, actual value, expected value, SUCCESS or FAILURE), JUnit and JSON file paths, wall time, and an infrastructure-error flag.
- `recorder_files` (string[]): Path of the CARLA recorder `.log` file per scenario id, for replay.

---

## Phase 1: Install scenario_runner for This CARLA Version

### Entry Criteria
- `determinism_report` verdict is "DETERMINISTIC" and its seed equals `sim_seed`. If "DIVERGES", results can still be produced but must be labeled non-comparable.

### Actions
1. Clone `https://github.com/carla-simulator/scenario_runner` and check out the tag matching the CARLA version (for example `v0.9.15`). A mismatched tag is a common source of attribute errors.
2. `pip install -r requirements.txt` inside the CARLA client venv.
3. Export `CARLA_ROOT=<carla_dir>` and `SCENARIO_RUNNER_ROOT=<scenario_runner_dir>`, and add `$CARLA_ROOT/PythonAPI/carla` to `PYTHONPATH` (agents are imported from there).
4. List options: `python scenario_runner.py --help`. Confirm these exist on your tag before use: `--openscenario`, `--sync`, `--trafficManagerSeed`, `--junit`, `--json`, `--outputDir`, `--record`, `--timeout`, `--reloadWorld`, `--output`.

### Output
Installed scenario_runner with a confirmed option list.

### Quality Gate
- `git -C $SCENARIO_RUNNER_ROOT describe --tags` matches the CARLA version.
- `--help` output is saved and lists every option used below.

---

## Phase 2: Run Each Entry

### Entry Criteria
- Phase 1 gate passed; server started from `carla_server_cmd`.

### Actions
1. For each library entry, run one process (one scenario per process keeps failures isolated):
   `python scenario_runner.py --openscenario <entry.file> --sync --trafficManagerSeed <entry.seed> --reloadWorld --timeout <seconds> --output --junit --json --outputDir results/<entry.id> --record results/<entry.id>`
   Set `--timeout` from the scenario's own `$MaxTime` plus margin documented in the run notes, not a guess.
2. scenario_runner waits for the ego vehicle. Start the system under test or the ego agent that spawns the ego with the role name the scenario expects, per scenario_runner's docs for OpenSCENARIO. Only scenario_runner ticks the world in `--sync`; the ego agent must not call `world.tick()`.
3. Capture stdout and stderr to `results/<entry.id>/run.log` and the exit code.
4. After each run, confirm the server is still alive; if it crashed, restart it from `carla_server_cmd` and mark the entry as infrastructure error.
5. Do NOT rerun a failed scenario until it passes and keep only the pass. Every attempt is kept with its log.

### Output
Per-entry result folders.

### Quality Gate
- Every library id has a `results/<id>/run.log` and an exit code.
- Every id has a JUnit XML or is flagged infrastructure error.

---

## Phase 3: Classify Results

### Entry Criteria
- All entries attempted.

### Actions
1. Parse JUnit: each `testcase` is a criterion (for example `CollisionTest`, `KeepLaneTest`, `RouteCompletionTest`); a `failure` child means FAILURE. List names, actual and expected values from the JSON file.
2. Classify each entry:

| Evidence | Class |
|---|---|
| Server crash, connection time-out, or Python traceback in scenario_runner itself | Infrastructure error (not a scenario result) |
| All criteria SUCCESS | Scenario pass |
| Any criterion FAILURE | Scenario fail, list the failed criteria |
| Timed out before StopTrigger | Scenario fail: timeout |

3. Collect the recorder file path per id into `recorder_files` (scenario_runner writes a `.log` under the `--record` folder; confirm with `ls`).
4. Write `scenario_results`.

### Output
`scenario_results`, `recorder_files`.

### Quality Gate
- Count of pass + fail + infrastructure error equals the library size.
- Every `recorder_files` path exists (`ls`).

---

## Worked Example

Illustrative.
```
$ python scenario_runner.py --openscenario scenarios/variants/cutin-highway-007.xosc --sync --trafficManagerSeed 1007 --reloadWorld --timeout 60 --output --junit --json --outputDir results/cutin-highway-007 --record results/cutin-highway-007
...
| CollisionTest      | SUCCESS | 0 | 0 |
| KeepLaneTest       | FAILURE | 1 | 0 |
```
Result: cutin-highway-007 scenario fail (KeepLaneTest); recorder file `results/cutin-highway-007/OpenScenario_cutin.log`.

---

## Exit Criteria

DONE when every library entry has a classified result with its criteria and a recorder file, and infrastructure errors are separated from scenario failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `AttributeError` on a carla object | **Adjust**: scenario_runner tag does not match CARLA; check out the matching tag. |
| Phase 2 | Waits forever for ego | **Adjust**: start the ego agent with the expected role name. |
| Phase 2 | Server crash | **Retry**: restart the server once; mark infrastructure error if it recurs. |
| Phase 3 | Determinism verdict DIVERGES | **Return**: label results non-comparable and send back to the determinism flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
