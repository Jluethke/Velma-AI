# Headless esmini Run of an OpenSCENARIO File

**One-line description:** Runs a `.xosc` scenario headless in esmini with a fixed time step, records it, converts the recording to CSV, and checks that every event fired and the scenario stopped on its own before it goes to a heavier simulator.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `xosc_file` (string, required): Schema-valid scenario from `vsim-openscenario-author`.

---

## Outputs

- `scenario_check_report` (object): esmini version, time step, whether each Event started and ended (with sim time), whether the StopTrigger fired, collision detections, and the CSV path of the recorded trajectories. Verdict "PASS" or "FAIL" with the reason.

---

## Phase 1: Install and Run Headless

### Entry Criteria
- `xosc_file` validates with xmllint.

### Actions
1. Download the esmini release for your OS from the esmini GitHub releases page; binaries are in `bin/`. Record the version (`./bin/esmini --version`).
2. List the options on your version: `./bin/esmini --help`. Confirm these exist before use: `--headless`, `--osc`, `--fixed_timestep`, `--record`, `--collision`, `--csv_logger`.
3. Choose the time step: use the same step you will use in the main simulator (for example the CARLA `fixed_delta_seconds`) so trigger timing matches.
4. Run: `./bin/esmini --headless --osc scenarios/cut_in.xosc --fixed_timestep 0.05 --record cut_in.dat --collision --csv_logger cut_in_log.csv > esmini.log 2>&1`.
5. Do NOT run esmini without `--fixed_timestep` for checks; real-time stepping varies between runs.

### Output
`esmini.log`, `cut_in.dat`, `cut_in_log.csv`.

### Quality Gate
- Exit code is 0 (`echo $?` right after the run).
- `esmini.log` contains no line with `Error` (`grep -i -c error esmini.log` prints 0).

---

## Phase 2: Read the Event Log

### Entry Criteria
- Phase 1 run completed.

### Actions
1. esmini logs storyboard state changes. Find them: `grep -E "standbyState|runningState|endTransition|completeState" esmini.log` (exact words vary by version; read a few lines of the log to learn your version's wording).
2. For each Event in the `.xosc`, record the sim time it went to running and to complete. An Event that never starts means its trigger condition never became true.
3. Confirm the StopTrigger fired: the log shows the storyboard ending before any external timeout.
4. Convert the recording for plotting: `./bin/dat2csv cut_in.dat` writes `cut_in.csv`. Plot lateral position of the target over time to see the lane change.
5. Collisions: with `--collision`, esmini logs collision messages; `grep -i collision esmini.log`.

### Output
Event timing table and collision list.

### Quality Gate
- Every Event name from the `.xosc` (`grep -o 'Event name="[^"]*"' scenarios/cut_in.xosc`) appears in the timing table with a start time or an explicit "never started".

---

## Phase 3: Verdict

### Entry Criteria
- Event table complete.

### Actions
1. Apply these rules in order:

| Condition | Verdict |
|---|---|
| esmini error or nonzero exit | FAIL: file problem |
| Any Event never started | FAIL: trigger never true; check parameter values and entity names |
| StopTrigger did not fire | FAIL: scenario has no reachable end |
| Collision in a scenario described as collision-free with default parameters | FAIL: scenario geometry wrong |
| None of the above | PASS |

2. Write `scenario_check_report`.
3. Note: esmini uses its own simple vehicle motion. A PASS here checks scenario logic, not the vehicle dynamics or the system under test.

### Output
`scenario_check_report`.

### Quality Gate
- Report holds a verdict, the rule that decided it, and the CSV path.

---

## Worked Example

Illustrative.
```
$ ./bin/esmini --headless --osc scenarios/cut_in.xosc --fixed_timestep 0.05 --record cut_in.dat --collision > esmini.log 2>&1; echo $?
0
$ grep -E "CutInEvent" esmini.log
4.150: CutInEvent standbyState -> startTransition -> runningState
7.150: CutInEvent runningState -> endTransition -> completeState
$ ./bin/dat2csv cut_in.dat
```
Report: CutInEvent ran 4.15 s to 7.15 s; StopTrigger at 20.0 s; no collision; PASS.

---

## Exit Criteria

DONE when the scenario runs headless with a fixed step and the report states for every Event whether it fired, whether the scenario ended itself, and a verdict.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Option not in `--help` | **Adjust**: use the equivalent your version lists; do not pass unknown flags. |
| Phase 1 | Road file not found | **Adjust**: fix `LogicFile filepath` relative to the `.xosc` location. |
| Phase 2 | Event never starts | **Return**: to `vsim-openscenario-author` with the trigger and parameter values. |
| Phase 3 | Scenario never ends | **Return**: add a reachable StopTrigger. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
