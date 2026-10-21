# CARLA Synchronous Mode with Fixed Time Step

**One-line description:** Writes a Python client loop that puts the CARLA world and Traffic Manager into synchronous mode with a fixed time step, advances the simulation only with `world.tick()`, and always restores asynchronous settings on exit so the server never freezes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `carla_client_env` (object, required): From `vsim-carla-server-setup`: interpreter, client version, RPC port and Traffic Manager port.
- `fixed_delta_seconds` (number, required): Simulated seconds per tick. Must satisfy the CARLA physics substepping rule in Phase 1.

---

## Outputs

- `sync_loop_script` (string): Path to a Python script that enables synchronous mode, ticks a fixed number of frames, logs frame numbers and simulation time, and restores settings in a `finally` block.

---

## Phase 1: Check the Time Step Against Substepping Limits

### Entry Criteria
- `carla_client_env` version check passed.

### Actions
1. Read the current physics settings: `python -c "import carla; w=carla.Client('localhost',2000).get_world(); s=w.get_settings(); print(s.substepping, s.max_substep_delta_time, s.max_substeps)"`. CARLA's documented defaults are substepping True, `max_substep_delta_time` 0.01, `max_substeps` 10.
2. Apply the rule from the CARLA "Synchrony and time-step" documentation: `fixed_delta_seconds <= max_substep_delta_time * max_substeps`. With defaults that limit is 0.1 s.
3. If `fixed_delta_seconds` breaks the rule, either lower it or raise `max_substeps` (CARLA documents a maximum of 16). Record which you changed.
4. Note the sensor implication: a sensor whose `sensor_tick` is smaller than `fixed_delta_seconds` still produces at most one measurement per tick.

### Output
A validated `fixed_delta_seconds` and substepping values.

### Quality Gate
- The product `max_substep_delta_time * max_substeps` is printed and is greater than or equal to `fixed_delta_seconds`.

---

## Phase 2: Write the Synchronous Loop

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `sim/sync_loop.py` in the user's project (never in the marketplace). Structure it exactly like this:
```python
import carla, csv, sys
client = carla.Client('localhost', 2000); client.set_timeout(20.0)
world = client.get_world()
original = world.get_settings()
tm = client.get_trafficmanager(8000)
try:
    s = world.get_settings()
    s.synchronous_mode = True
    s.fixed_delta_seconds = FIXED_DT
    world.apply_settings(s)
    tm.set_synchronous_mode(True)
    with open('frames.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['frame', 'elapsed_seconds'])
        for _ in range(N_TICKS):
            frame = world.tick()
            snap = world.get_snapshot()
            w.writerow([frame, snap.timestamp.elapsed_seconds])
finally:
    tm.set_synchronous_mode(False)
    world.apply_settings(original)
```
2. Replace `FIXED_DT` with `fixed_delta_seconds` and `N_TICKS` with a command-line argument. Replace the ports with the ones in `carla_client_env`.
3. Exactly one client may call `world.tick()`. If another script (manual control, ROS bridge, scenario_runner) also ticks, the frame rate doubles and timing is wrong. Pick one ticking owner and make every other client passive.
4. Do NOT use `time.sleep()` to pace the loop; simulation time advances only with `world.tick()`.
5. Do NOT remove the `finally` block. If a synchronous client dies without restoring settings, the server waits forever for the next tick.

### Output
`sync_loop_script` on disk.

### Quality Gate
- `grep -n "finally" sim/sync_loop.py` finds the restore block.
- `grep -c "world.tick()" sim/sync_loop.py` prints 1.

---

## Phase 3: Prove the Clock Is Fixed

### Entry Criteria
- Script written; server running.

### Actions
1. Run `python sim/sync_loop.py 200`.
2. Compute the step sizes: `python -c "import csv; r=list(csv.DictReader(open('frames.csv'))); d=[float(b['elapsed_seconds'])-float(a['elapsed_seconds']) for a,b in zip(r,r[1:])]; print(min(d), max(d), len(d))"`.
3. Read the result: min and max both equal `fixed_delta_seconds` (to floating-point rounding) means synchronous fixed stepping works. Varying deltas mean the world is still asynchronous or `fixed_delta_seconds` was not applied.
4. Confirm frames are consecutive: `python -c "import csv; f=[int(r['frame']) for r in csv.DictReader(open('frames.csv'))]; print(all(b-a==1 for a,b in zip(f,f[1:])))"` prints `True`. Gaps mean a second client is ticking.
5. After the script exits, run the Phase 1 settings check again and confirm `synchronous_mode` is False.

### Output
Verified `sync_loop_script`.

### Quality Gate
- Step-size min and max equal `fixed_delta_seconds`.
- Frame-continuity check prints `True`.
- `world.get_settings().synchronous_mode` is False after exit.

---

## Worked Example

Illustrative. `fixed_delta_seconds` = 0.05. Phase 1 prints `True 0.01 10`; limit 0.1 >= 0.05, so no change. Phase 3:
```
$ python sim/sync_loop.py 200
$ python -c "...min/max..."
0.04999999999999716 0.05000000000000426 199
$ python -c "...continuity..."
True
```
The script restores asynchronous mode; a follow-up settings print shows `synchronous_mode=False`.

---

## Exit Criteria

DONE when the loop ticks with a constant step equal to `fixed_delta_seconds`, frames are consecutive, and settings are restored on exit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `fixed_delta_seconds` above the substep limit | **Adjust**: lower it or raise `max_substeps` within the documented maximum. |
| Phase 2 | Second client also ticks | **Adjust**: make one process the only ticking owner. |
| Phase 3 | Server hangs after a crash | **Retry**: run a small script that applies `synchronous_mode=False` and `fixed_delta_seconds=None`, then rerun. |
| Phase 3 | Deltas vary | **Return**: to Phase 2; the settings were not applied before ticking. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
