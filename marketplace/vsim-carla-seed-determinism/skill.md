# CARLA Deterministic Seeds and Repeat-Run Check

**One-line description:** Pins every random source in a CARLA run (Python, NumPy, Traffic Manager, pedestrians) and proves determinism by running the same scenario twice on the same machine and comparing per-frame actor states, reporting the first diverging frame if any.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_rig_script` (string, required): Script from `vsim-carla-sensor-rig` that spawns the ego and ticks in synchronous mode.
- `sim_seed` (integer, required): The seed for this run. Store it with every result so the run can be repeated.

---

## Outputs

- `determinism_report` (object): Seed, CARLA version, machine and GPU, number of runs, per-run SHA-256 of the actor-state log, verdict "DETERMINISTIC" or "DIVERGES", and for a divergence the first frame, actor id and field that differ.

---

## Phase 1: Pin Every Random Source

### Entry Criteria
- `sensor_rig_script` passes its own gate.

### Actions
1. Add seeding at the top of the script, before any spawn: `random.seed(sim_seed)`, `numpy.random.seed(sim_seed)` (or pass a `numpy.random.default_rng(sim_seed)` everywhere).
2. Seed the Traffic Manager after getting it and before spawning traffic: `tm.set_random_device_seed(sim_seed)`, and keep `tm.set_synchronous_mode(True)`.
3. Seed pedestrians before spawning them: `world.set_pedestrians_seed(sim_seed)`.
4. Reload the world at the start of each run so no actors from an earlier run remain: `client.reload_world()` (it keeps the current map), then reapply synchronous settings.
5. Spawn actors in a fixed order from fixed spawn-point indices. Never iterate a `set` or an unsorted dictionary to choose spawns.
6. Check these determinism breakers with `grep` and remove or pin them:
   - `time.time()` or wall-clock values feeding logic.
   - `tm.set_hybrid_physics_mode(True)` changes physics for far vehicles; keep the same value across runs.
   - Asynchronous mode anywhere in the run.
7. Write an actor-state log each tick: frame, actor id, type id, x, y, z, yaw, vx, vy, vz, rounded to a stated number of decimals that you record in the report (rounding hides floating-point print noise, not real divergence; keep it as fine as the float print allows).

### Output
A seeded script that writes `actor_states.csv`.

### Quality Gate
- `grep -n -E "set_random_device_seed|set_pedestrians_seed|random.seed" sim/sensor_rig.py` shows all three before the first `spawn_actor`.
- `grep -n "time.time()" sim/sensor_rig.py` finds no use in control or spawn logic.

---

## Phase 2: Run Twice and Compare

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run A: `python sim/sensor_rig.py 300 --seed <sim_seed> --out runA`.
2. Run B: same command with `--out runB`, on the same machine, same server process restarted, same `carla_version`.
3. Hash: `sha256sum runA/actor_states.csv runB/actor_states.csv`.
4. If hashes differ, find the first difference: `diff <(cut -d, -f1- runA/actor_states.csv) <(cut -d, -f1- runB/actor_states.csv) | head -5`. The first line number points to the first diverging row; read its frame and actor id.
5. Run a third time with a different seed and confirm its hash differs. Identical hashes for different seeds mean the seed is not reaching the random sources.

### Output
Hashes and the first-divergence record.

### Quality Gate
- Runs A and B hashes are printed side by side.
- The different-seed run hash differs from run A.

---

## Phase 3: Report

### Entry Criteria
- Phase 2 complete.

### Actions
1. Verdict: "DETERMINISTIC" when A and B hashes match and the different-seed hash differs; otherwise "DIVERGES".
2. For "DIVERGES", classify with this table:

| First diverging actor | Likely cause | Next action |
|---|---|---|
| Traffic Manager vehicle | TM not seeded or TM in asynchronous mode | Recheck Phase 1 steps 2 and 6. |
| Pedestrian | `set_pedestrians_seed` after spawn | Move the call before spawn. |
| Ego vehicle at frame 1 | Spawn order or spawn point differs | Fix order; use indices. |
| Any actor late in the run only | Physics non-determinism under load | Record as open question; rerun on an idle machine. |

3. State the scope: determinism is claimed only for the same machine, GPU, driver and CARLA version. Cross-machine equality is an open question until tested.

### Output
`determinism_report`.

### Quality Gate
- `determinism_report` contains the seed, both hashes, the verdict, and the machine scope statement.

---

## Worked Example

Illustrative. `sim_seed` = 42.
```
$ sha256sum runA/actor_states.csv runB/actor_states.csv
9f1c...e2  runA/actor_states.csv
9f1c...e2  runB/actor_states.csv
$ python sim/sensor_rig.py 300 --seed 43 --out runC && sha256sum runC/actor_states.csv
47aa...10  runC/actor_states.csv
```
Report: DETERMINISTIC, seed 42, CARLA 0.9.15, RTX 4070 driver 550, scope same machine.

---

## Exit Criteria

DONE when `determinism_report` holds a verdict with hashes, and any divergence names its first frame, actor and likely cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Script runs in asynchronous mode | **Return**: to `vsim-carla-sync-mode`; determinism needs fixed stepping. |
| Phase 2 | Hashes differ at frame 1 | **Adjust**: fix spawn order and reload the world between runs. |
| Phase 2 | Different seeds give equal hashes | **Adjust**: the seed is not applied; trace where randomness enters. |
| Phase 3 | Divergence only under load | **Return**: report as an open question with the frame; do not loosen rounding to hide it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
