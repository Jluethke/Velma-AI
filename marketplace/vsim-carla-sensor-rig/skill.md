# CARLA Sensor Rig with Frame-Matched Queues

**One-line description:** Attaches camera, LiDAR, radar, GNSS, IMU and collision sensors to an ego vehicle in synchronous mode, collects every sensor's data through a per-sensor queue matched to the tick's frame number, and logs a per-frame record that later flows read.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sync_loop_script` (string, required): Verified script from `vsim-carla-sync-mode`.
- `sensor_spec` (object[], required): One entry per sensor: CARLA blueprint id, mounting position (x, y, z in meters, CARLA frame), rotation (pitch, yaw, roll in degrees), and attributes copied from the real sensor datasheet (resolution, field of view, channels, range, rate).

---

## Outputs

- `sensor_rig_script` (string): Path to the script that spawns the ego vehicle and all sensors, ticks, and saves frame-matched data.
- `sensor_frame_log` (string): Path to a CSV with one row per tick: frame, simulation time, ego pose, ego velocity, and for each sensor the frame of the data it delivered.

---

## Phase 1: Map the Spec to Blueprints

### Entry Criteria
- `sync_loop_script` passed its gate.
- `sensor_spec` lists at least one sensor.

### Actions
1. For each entry, confirm the blueprint and attribute names exist: `python -c "import carla; bp=carla.Client('localhost',2000).get_world().get_blueprint_library().find('sensor.lidar.ray_cast'); print([a.id for a in bp])"`. Use only attribute names this prints.
2. Use these blueprint ids: `sensor.camera.rgb`, `sensor.camera.depth`, `sensor.camera.semantic_segmentation`, `sensor.lidar.ray_cast`, `sensor.other.radar`, `sensor.other.gnss`, `sensor.other.imu`, `sensor.other.collision`, `sensor.other.lane_invasion`.
3. Convert mounting positions to CARLA's frame: x forward, y right, z up, meters, left-handed (Unreal). A ROS (REP 103, right-handed, y left) position (x, y, z) becomes CARLA (x, -y, z); yaw flips sign too.
4. LiDAR: set `rotation_frequency` to `1 / fixed_delta_seconds` so one tick holds one full sweep. Otherwise each tick holds a partial sweep and point counts look wrong.
5. Set `sensor_tick` to `0.0` (every tick) unless the real sensor runs slower; if slower, set it to the real period.

### Output
A table of blueprint id, transform and attributes per sensor.

### Quality Gate
- Every attribute name appears in the Phase 1 step 1 printout for its blueprint.
- Every transform is recorded in the CARLA frame with the conversion noted.

---

## Phase 2: Spawn and Listen with Queues

### Entry Criteria
- Phase 1 table complete.

### Actions
1. Copy `sync_loop_script` to `sim/sensor_rig.py`. Inside the `try` block, after enabling synchronous mode:
   - Spawn the ego: `ego = world.spawn_actor(bp_lib.find('vehicle.lincoln.mkz_2020'), world.get_map().get_spawn_points()[SPAWN_INDEX])` (pick the model and spawn index the scenario needs; list models with `[b.id for b in bp_lib.filter('vehicle.*')]`).
   - For each sensor: `q = queue.Queue(); s = world.spawn_actor(bp, transform, attach_to=ego); s.listen(q.put)`. Keep `(name, sensor, q)` in a list.
2. In the tick loop: `frame = world.tick()`, then for each sensor `data = q.get(timeout=2.0)` and assert `data.frame == frame`. Collision and lane-invasion sensors only fire on events; read them with `q.get_nowait()` inside `try/except queue.Empty`.
3. Save raw data by frame: `image.save_to_disk('out/cam/%06d.png' % image.frame)`; LiDAR `data.save_to_disk('out/lidar/%06d.ply' % data.frame)`; GNSS fields `latitude, longitude, altitude`; IMU `accelerometer, gyroscope, compass`.
4. In the `finally` block, call `s.stop()` and `s.destroy()` for every sensor, then `ego.destroy()`, before restoring settings. Leaked sensors keep streaming and slow every later run.
5. Do NOT call blocking work (disk writes of large point clouds) inside the `listen` callback; the callback only puts into the queue.

### Output
`sensor_rig_script` on disk.

### Quality Gate
- `grep -n "destroy()" sim/sensor_rig.py` shows a destroy for sensors and ego inside `finally`.
- `grep -n "data.frame == frame" sim/sensor_rig.py` finds the frame assertion.

---

## Phase 3: Run and Check Frame Alignment

### Entry Criteria
- Script written; server running.

### Actions
1. Run `python sim/sensor_rig.py 100`. The script writes `sensor_frame_log.csv` with columns frame, elapsed_seconds, x, y, z, yaw, speed_mps, then one `<sensor>_frame` column per continuous sensor.
2. Check alignment: every `<sensor>_frame` equals `frame` on every row. One mismatch means data from a different tick was paired; fix before going further.
3. Check counts: `ls out/cam | wc -l` equals the tick count for a camera with `sensor_tick` 0.0.
4. Check LiDAR sweep: open one `.ply` and confirm points surround the vehicle in a full circle when `rotation_frequency` matches the tick.
5. Confirm no actors leak: after exit, `python -c "import carla; print(len(carla.Client('localhost',2000).get_world().get_actors().filter('sensor.*')))"` prints 0.

### Output
`sensor_frame_log`.

### Quality Gate
- Alignment check finds zero mismatched rows.
- Sensor actor count after exit is 0.

---

## Worked Example

Illustrative. `sensor_spec`: front camera 1920x1080, fov 90, at ROS (1.6, 0.0, 1.5); 32-channel LiDAR at ROS (0.0, 0.0, 2.0), range 100; IMU at origin. `fixed_delta_seconds` 0.05, so LiDAR `rotation_frequency` = 20.

Phase 3 output:
```
$ python sim/sensor_rig.py 100
$ python -c "import csv; r=list(csv.DictReader(open('sensor_frame_log.csv'))); print(sum(1 for x in r if x['cam_front_frame']!=x['frame'] or x['lidar_top_frame']!=x['frame']))"
0
$ ls out/cam | wc -l
100
```

---

## Exit Criteria

DONE when every continuous sensor delivers exactly one measurement per tick with a frame number equal to the tick's frame, and no sensor actors remain after exit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Attribute name not in blueprint | **Adjust**: use the name the blueprint lists; do not invent attributes. |
| Phase 2 | Spawn fails with collision at spawn point | **Retry**: use a different spawn index or `try_spawn_actor` and check for None. |
| Phase 3 | `queue.Empty` on `q.get` | **Adjust**: check `sensor_tick`; a slower sensor does not deliver every tick, so read it with `get_nowait`. |
| Phase 3 | Frame mismatch | **Return**: to Phase 2; drain queues each tick and confirm only one client ticks. |
| Phase 3 | Sensors remain after exit | **Adjust**: add the missing `destroy()` calls in `finally`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
