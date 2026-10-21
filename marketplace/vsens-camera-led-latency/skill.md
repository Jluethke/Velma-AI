# Camera Event-to-Timestamp Latency with a PPS-Driven LED

**One-line description:** Measures the offset between a camera frame's timestamp and the real moment light hit the sensor by filming an LED switched by the GNSS PPS edge, using partially lit frames to bound the offset from both sides, for any capture stack (V4L2, GStreamer or ROS 2).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clock_discipline_report` (object, required): From `vsens-pps-chrony`; the host clock follows PPS, so integer seconds on the host clock are the LED events.
- `camera_control_settings` (object, required): From `vsens-v4l2-exposure-framerate`; gives exposure time E and frame period T.
- `led_gpio` (object, required): The LED circuit: PPS output pin, the driver transistor or buffer used, LED part number, and the receiver's time pulse length setting. The LED is never driven straight from the receiver pin beyond the pin's rated current from its datasheet.

---

## Outputs

- `optical_latency_report` (object): Number of events captured, the count of fully lit and partially lit first frames, the bound on stamp offset from partially lit frames (lower and upper), the distribution of stamp minus event time over all events, and the documented stamp meaning of the capture stack used.

---

## Phase 1: Build and Check the Rig

### Entry Criteria
- `clock_discipline_report` shows PPS selected (`#*`).
- Time pulse length is longer than the frame period T, so every pulse spans at least one full frame. Read the pulse length from the receiver config.

### Actions
1. Wire PPS to the LED through a transistor or logic buffer sized from the LED datasheet current and the receiver pin rating.
2. Confirm the LED edge with `ppstest` running on the same PPS line: the LED must turn on when `assert` fires. If the LED shares the line with the PPS input, confirm the added load does not change the edge per the receiver's electrical spec.
3. Place the LED in the camera view, close enough to cover several pixels, in a dim scene. Use the exposure from `camera_control_settings`; a short exposure tightens the bound.
4. Record the region of interest (pixel box) around the LED.

### Output
Rig with LED ROI.

### Quality Gate
- `ppstest` shows a clean sequence while the LED is connected.
- One saved frame shows the LED lit inside the recorded ROI.

---

## Phase 2: Capture and Classify Frames

### Entry Criteria
- Rig ready.

### Actions
1. Record at least as many PPS events as the user chose (each second is one event), saving every frame's timestamp exactly as the capture stack delivers it: V4L2 buffer `timestamp` (CLOCK_MONOTONIC per `V4L2_BUF_FLAG_TIMESTAMP_MONOTONIC`, convert to CLOCK_REALTIME by sampling both clocks once at start), GStreamer buffer PTS plus pipeline base time, or ROS 2 `header.stamp`.
2. For each frame compute mean intensity in the ROI. Set `off` as the median of frames well away from any second boundary, and `on` as the median of frames fully within a pulse.
3. Classify each frame: off, partial (strictly between `off` and `on` levels by more than the off-frame intensity spread), or on.
4. For each event second t_e, find the first frame that is partial or on. Record its stamp s and its class.

### Output
Per-event first frame, class, and s minus t_e.

### Quality Gate
- Every event has a first frame; missing events are counted.
- Off-level spread and on-level are printed, so the partial rule can be checked.

---

## Phase 3: Bound the Offset

### Entry Criteria
- Per-event table exists.

### Actions
1. For a global shutter camera, a partial frame's exposure window [a, a+E] contains t_e. So with stamp offset relative to exposure start written as c = s - a, every partial event gives `s - t_e` in [c - E, c]. Across partial events, c is at least max(s - t_e) and at most min(s - t_e) + E. Report both bounds.
2. For a rolling shutter camera, the LED row matters: exposure starts later for lower rows by the row readout time. Record the LED row and the sensor line time from the datasheet; the bound applies to that row.
3. Report the distribution of `s - t_e` over all events (fully lit first frames widen it by up to T because event and frame phase are unrelated).
4. Compare the result with the documented stamp meaning. Example: if the driver claims stamp equals exposure start (c near 0) but the bound shows c near 30 ms, the stamp is actually taken at buffer dequeue.
5. Emit `optical_latency_report`.

### Output
`optical_latency_report`.

### Quality Gate
- The lower and upper bound on c are printed with the number of partial events used.
- The report states whether the bound agrees with the documented stamp meaning.

---

## Worked Example

Illustrative only. 30 fps global shutter, E = 2 ms, 600 events.

```
$ python3 led_latency.py --frames cap/ --stamps stamps.csv --roi 812,402,830,420
events 600, missed 0, first-frame partial 37, on 563
off level 11.2 (spread 1.4), on level 201.7
partial s - t_e: max 0.0291 s, min 0.0278 s
stamp offset c from exposure start: lower 0.0291 s, upper 0.0298 s
```
The V4L2 stamps sit about 29 ms after exposure start; the driver documentation said start of exposure, so the report flags the mismatch.

---

## Exit Criteria

DONE when partial frames bound the stamp offset from both sides and the result is compared with the documented stamp meaning.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | LED loads PPS edge | **Stop**: add a buffer; do not share an unbuffered PPS line. |
| Phase 2 | No partial frames | **Adjust**: lengthen exposure slightly within the frame period or capture more events, then **Retry**. |
| Phase 2 | Missing first frames | **Return**: to `vsens-gstreamer-capture-pipeline` to remove frame drops. |
| Phase 3 | Bounds cross (lower above upper) | **Stop**: the host clock or the stamp clock conversion is wrong; recheck CLOCK_MONOTONIC to CLOCK_REALTIME conversion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
