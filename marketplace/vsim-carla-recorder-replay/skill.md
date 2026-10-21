# Replay and Query CARLA Recorder Files

**One-line description:** Uses the CARLA recorder API to list what a recorded scenario contains, query its collisions and blocked actors, and replay a chosen time window following the ego so a failed scenario can be inspected and re-sensed without rerunning it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `carla_client_env` (object, required): Client environment from `vsim-carla-server-setup`.
- `recorder_files` (string[], required): Recorder `.log` files from `vsim-scenario-runner-exec` or from `client.start_recorder`.

---

## Outputs

- `replay_report` (object): Per file: duration, frame count, actor list with ids and type ids, collision list (time, actor ids and types), blocked-actor list, and the replay window inspected with notes.

---

## Phase 1: Read File Info

### Entry Criteria
- A CARLA server of the same version that recorded the file is running. Recorder files are not portable across CARLA versions.

### Actions
1. Pass the absolute path or a name relative to the server's default recorder folder (`CarlaUE4/Saved/` on the server machine). Paths are resolved on the server, not the client.
2. Summary: `python -c "import carla; c=carla.Client('localhost',2000); c.set_timeout(30); print(c.show_recorder_file_info('/abs/path/run.log', False))" > info.txt`. With `True` instead of `False` it prints every frame; use that only for short files.
3. Read from `info.txt`: map name, date, duration, total frames, and each `Create` line (actor id and type id). Write the ego's id (role name in attributes, often `hero`).

### Output
Actor table and duration.

### Quality Gate
- `info.txt` contains `Frames:` and `Duration:` lines (`grep -E "Frames|Duration" info.txt`).
- The ego actor id is recorded.

---

## Phase 2: Query Events

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Collisions: `c.show_recorder_collisions('/abs/path/run.log', 'v', 'a')`. The two letters filter actor categories: `h` hero, `v` vehicle, `w` walker, `t` traffic light, `o` other, `a` any. Use `'h','a'` to list everything the ego hit.
2. Blocked actors: `c.show_recorder_actors_blocked('/abs/path/run.log', min_time, min_distance)`. `min_time` and `min_distance` are user inputs (seconds and centimeters per the CARLA docs; confirm units in the Python API reference for your version).
3. Record each collision's time, both actor ids and types. Map ids back to names via the Phase 1 table.

### Output
Collision and blocked-actor lists.

### Quality Gate
- Collision query output is saved, even when empty, with the filter letters used.

---

## Phase 3: Replay a Window

### Entry Criteria
- Event lists recorded.

### Actions
1. Pick the window: start a few seconds before the first collision or failure time, duration covering the event. The exact margin is a user choice and is recorded.
2. Replay: `c.replay_file('/abs/path/run.log', start_s, duration_s, ego_id)`. The fourth argument makes the spectator camera follow that actor; pass 0 to keep the camera free. A negative start counts from the end.
3. Physics during replay: by default actors follow recorded transforms. `c.set_replayer_ignore_hero(True)` lets you drive the ego live while others replay (use only to test a new controller in simulation).
4. To re-sense a replay, attach sensors to the replayed ego and tick in synchronous mode as in `vsim-carla-sensor-rig`; set `c.set_replayer_time_factor(1.0)` to keep normal speed.
5. Stop: `c.stop_replayer(False)` (True keeps actors). Write notes on what the replay shows.

### Output
`replay_report`.

### Quality Gate
- `replay_report` lists the window start and duration, ego id, and notes for each collision.
- After stop, `world.get_actors()` count returns to the pre-replay value or the kept actors are listed.

---

## Worked Example

Illustrative.
```
>>> print(c.show_recorder_collisions('/data/results/cutin-007/run.log','h','a'))
Version: 1
Map: Town04
    Time  Types     Id Actor 1                                 Id Actor 2
      12   h v      197 vehicle.lincoln.mkz_2020               205 vehicle.audi.tt
Frames: 401
Duration: 20.05 seconds
>>> c.replay_file('/data/results/cutin-007/run.log', 9.0, 5.0, 197)
```
Report: one ego collision at 12 s with the cut-in vehicle 205; replay 9 s to 14 s shows the target entering the lane while ego braking began late.

---

## Exit Criteria

DONE when each recorder file has its actor table, collision and blocked lists, and an inspected replay window with notes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `File not found` | **Adjust**: give the path as seen by the server machine. |
| Phase 1 | Garbled or empty info | **Stop**: the file was recorded by another CARLA version; use the matching server. |
| Phase 3 | Map differs from current world | **Retry**: the replayer loads the recorded map; wait for load, then replay again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
