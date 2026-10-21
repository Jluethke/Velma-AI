# target vehicle Dashboard Video

Build a Raising the system video from the real target vehicle vehicle platform CAN capture: the dashboard,
the decode, the bus. The owner gives short direction on purpose and expects the
literal, minimal thing. Most pain in this work came from building more than was
asked. Read this before writing any render code.

## Execution Pattern: Phase Pipeline

```
PHASE 1: UNDERSTAND --> Read the literal ask. Build only that. No script, no
                        captions, no music, no voiceover, no arc unless asked.
PHASE 2: EXTRACT    --> Decode first_start.log to census.json + series.json.
                        Real values only. Reference the real numbers.
PHASE 3: RENDER     --> The real interface (dashboard.py / live_dash.py), Pillow
                        + bundled ffmpeg, 1080x1920 30fps, silent plate.
PHASE 4: VERIFY     --> Pull frames from the ENCODED mp4, read as a first-time
                        viewer, fix. Never fabricate, never hide a reading.
PHASE 5: DELIVER    --> Send the mp4 with SendUserFile. State honest limits.
     \                                                                       /
      +------------- owner reacts / new direction --- loop to PHASE 1 ------+
```

## Inputs

- `ask`: string -- the owner's literal request ("all systems go", "show before
  after decode", "collection buildup"). Build exactly this, nothing more.
- `capture`: path -- the CAN log. Default
  `Patent Work/the system_Jeep_target vehicle/captures/first_start.log`.
- `style`: string (optional) -- "plain" by default. "middle" only if asked.

## Outputs

- `mp4`: a silent 1080x1920 clip in `F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\canvid\out\`. A clean plate: the
  owner lays his own voiceover (from another video) and other footage over it.
- `render_notes`: the honest limits (what the data does and does not show).

## Prime directive: build the literal ask, nothing more

- The owner asks for a small, concrete thing. Build exactly that. Do NOT add a
  script, captions, a music bed, a voiceover, an intro, an outro, a narrative
  arc, or a page-turn story unless he asks in those words.
- No fake animation. To show a decode, show BEFORE (the raw frame) and AFTER
  (the decoded gauge) and cut. Do not fake a needle sweep, a byte-to-dial morph,
  or a "forming" animation unless he asks for motion.
- "Build up / collection" means the decoded items ACCUMULATE into a grid, each
  added and kept, until the full dashboard. Not shown-then-gone.
- When two literal readings are possible, ask ONE tight question or build the
  smaller one. Never expand scope to be safe.
- Silent by default. These are clean plates. Do not add audio unless asked.

## Never fabricate, never hide

- Show exactly what the bus decodes. Every number on screen is the real decode.
  No invented values, no padded frame counts, no fake shutoff.
- Never blank or "clean up" a real decoded reading because it looks
  inconvenient. Hiding a real reading is fabrication. If a reading looks wrong,
  the question is whether the DECODE is wrong, not whether to hide the lamp:
  verify the decode (does the bit change, does the scenario fit); if it is
  actually wrong, fix the decode table, never the display.
- Known decode quirks on this 2020 target vehicle (Chrysler Pacifica table):
  - AMBIGUOUS SIGNAL NAMES: the same signal name exists on more than one
    message. Vehicle_Speed is on ESP_8 (0x11C) AND ESP_1 (0x140); at idle ESP_8
    reads 0 and ESP_1 reads 1 km/h on a coarse scale. Accelerator_Position is on
    ECM_2 (0x120) AND ECM_5 (0x22F). Bind each gauge to the CAN id dashboard.py
    declares (speed->0x11C, accel->0x120) or the other module's estimate leaks
    in (road speed read a false 1 mph while parked). extract.py SOURCE map.
  - GEAR: use the authoritative Transmission_Status Gear_State (0x170). Do NOT
    fall back to PRNDL (0x2EA) -- it is the zero/one-based conflict and reads a
    false "R" at idle.
  - DOOR_OPEN_FR and SEATBELT_DRIVER_UNLATCHED decode to a constant 1. The
    pattern is coherent (only the front passenger door open, belt off, all other
    doors closed), consistent with sitting in the driver seat to start. Show it
    as decoded. Do not blank it. Do not make a verbal claim about it.
- Boot transients and sentinels: before a module validates, a signal can read
  garbage. Hold the last in-range value, or show "--" until a valid reading;
  never print the garbage and never a NaN. Seen here: STEER_ANGLE_2 1302 deg
  until ~4.2s; BRK_PRESSURE 4095 (12-bit all-ones = N/A) at power-on then real
  pressure (~1462 bleeding to 0 by ~5s, brake held to start); wheel speeds 8191;
  Vehicle_Speed ~511 km/h briefly.

## The data (ground truth: first_start.log)

- Exactly 356,140 frames, 143.48 s, 154 unique CAN ids. 36 ids decode to named
  signals; 56.9% of frames decode.
- Boot order: chassis buses live at t=0 (50-100 Hz); powertrain wakes ~2.0 s;
  engine fires 2.43 s, climbs to ~1600 cold idle, settles to ~886 warm idle.
- The capture ENDS with the engine still idling at 886 rpm. There is NO shutoff.
  Do not invent one. A run-to-shutoff must come from a capture that recorded it
  (drive_capture.py writes captures/<out>/can.log).
- The truck is stationary throughout: Vehicle_Speed and all wheel speeds are 0
  the whole run. Only RPM (and briefly brake pressure) have motion.

## The interface is the real one, reused

- The video is the real the system dashboard, not a lookalike. Import the real modules
  so palette, gauges and mappings are identical:
  - `dashboard.py` -> palette (BG #101317, CARD #1f242c, OK #4ec97e,
    WARN #e3b53f, BAD #e45c5c, ACCENT #5aa0f0, VIOLET #9b86e0, FG #dde3ea,
    DIM #7b8694), `Dashboard.GAUGES` (12 gauges), `GEARS`, `KMH_TO_MPH`.
  - `live_dash.py` -> the BUS IDS table (id | name | hz | count | last hex).
- One chrome across views: same top bar, palette, freshness-dot vocabulary,
  fonts (Segoe UI labels, Consolas numbers). Governor never on the dashboard.

## Tooling and layout

- Scripts: `F:\The Wayfinder Trust\IP\projects\Patent Work\the system_Jeep_target vehicle\Raisingthe system\rv_work\canvid\scripts\` (a junction to the F: Raisingthe system tree;
  sanctioned, physically on F:; never stage on the C: desktop).
  - `extract.py` -> census.json (per-id name/count/hz/first-last/last-hex,
    per-signal min/max/last/unit) + series.json (30 Hz sample-and-hold).
  - `dash_render.py` -> faithful renderer: `Replay`, `draw_cluster`, `draw_bus`
    (fixed count-rank slots), `draw_decode`, `draw_gauge` (270-deg dial).
  - `vid.py` -> encode PIL frames + mux audio via bundled ffmpeg
    (`imageio_ffmpeg.get_ffmpeg_exe()`).
- Output 1080x1920 vertical, 30 fps. Silent unless asked. mp4s to canvid\out\.

## Always verify the render before sending

- Pull frames from the ENCODED mp4 (not just the PIL frames), tile a montage,
  read it as a first-time viewer: legible at phone size, every number right,
  nothing fabricated, pacing sane. Fix, then send.

---

## Worked Example

Illustrative only.

Given typical inputs for Build a Raising the system video from the real target vehicle vehicle platform CAN capture: the dashboard, t, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


---

## Exit Criteria

DONE when all phase quality gates pass and all outputs are populated.


---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Any | Missing required input | **Stop**: report which input is missing and what it should contain. |
| Any | Upstream phase output incomplete | **Return**: re-run the upstream phase with the gap identified. |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
