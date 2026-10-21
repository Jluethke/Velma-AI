# Perception Multi-Object Tracking with ByteTrack or SORT

**One-line description:** Adds a tracking-by-detection stage after the detector using ByteTrack (two-stage association that also uses low-score detections) or SORT (Kalman filter plus Hungarian IoU matching), with every parameter taken from the reference implementation defaults or the user, and writes tracks in MOTChallenge format.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_postprocess_impl` (object, optional): Python detection pipeline.
- `cpp_postprocess_impl` (object, optional): C++ detection pipeline. One of the two must be present.
- `tracker_type` (string, required): "bytetrack" or "sort".
- `frame_rate` (number, required): Camera frame rate in frames per second, read from the recording metadata.

---

## Outputs

- `tracker_impl` (object): Implementation used (source repo and commit or package version), every parameter with its source, and the integration point.
- `track_outputs` (string): Folder of MOTChallenge text files, one per holdout sequence.

---

## Phase 1: Pick the Implementation and Parameters

### Entry Criteria
- The detector runs on video sequences with frame order and timestamps preserved (tracking needs consecutive frames; a shuffled image set cannot be tracked).

### Actions
1. Choose the implementation by stack:

| Stack | ByteTrack | SORT |
|---|---|---|
| Python | Ultralytics tracker (`model.track(source, tracker="bytetrack.yaml")`) or the reference repo `ifzhang/ByteTrack` `yolox/tracker/byte_tracker.py` | Reference `abewley/sort` `sort.py` |
| C++ | Reference repo `deploy/TensorRT/cpp` ByteTrack sources | Port of `sort.py` with a Kalman filter and `linear_sum_assignment` equivalent |

2. Take parameters from the chosen implementation and cite them. ByteTrack reference args: `track_thresh` 0.5, `match_thresh` 0.8, `track_buffer` 30 frames, with the low-score threshold 0.1 hard-coded in `byte_tracker.py` and new tracks started above `track_thresh + 0.1`; the buffer scales by `frame_rate / 30`. Ultralytics `bytetrack.yaml` keys: `track_high_thresh`, `track_low_thresh`, `new_track_thresh`, `track_buffer`, `match_thresh`, `fuse_score`. SORT reference defaults: `max_age=1`, `min_hits=3`, `iou_threshold=0.3`. Confirm each in your installed version.
3. Feed the tracker detections from a detector score threshold low enough for ByteTrack's second stage to see low-score boxes. If the detector already drops boxes below `track_thresh`, the second association stage has no input and ByteTrack degrades toward SORT.

### Output
Implementation and parameter table with sources.

### Quality Gate
- Every parameter has a value and a source (file and line, or user).

---

## Phase 2: Integrate and Run

### Entry Criteria
- Parameters fixed.

### Actions
1. Call the tracker once per frame in timestamp order with that frame's detections in original image pixels: `[x1, y1, x2, y2, score, class]`.
2. Reset the tracker state at the start of each sequence.
3. Run per class or class-agnostic as the implementation does; record which. Associating a pedestrian to a car track is a defect to watch for in class-agnostic mode.
4. Write each sequence as MOTChallenge lines: `frame,id,bb_left,bb_top,bb_width,bb_height,conf,-1,-1,-1` with frames starting at 1.

### Output
`track_outputs`.

### Quality Gate
- One file per sequence; `frame` values strictly start at 1 and never exceed the sequence length.
- No frame contains the same track id twice (checked with a script, count printed).

---

## Phase 3: Time the Tracker

### Entry Criteria
- Tracks written.

### Actions
1. Time the tracker update alone per frame with `time.perf_counter_ns()` (Python) or `std::chrono::steady_clock` (C++), excluding detection.
2. Report median and p99, and the maximum number of active tracks seen, since Hungarian cost grows with track count.

### Output
`tracker_impl` with timing.

### Quality Gate
- Median, p99 and max active tracks printed.

---

## Worked Example

Illustrative only. Python stack, `tracker_type=bytetrack`, `frame_rate=10` (KITTI tracking). Reference params cited; buffer scaled to 10 frames. Detector eval threshold 0.1 so low-score boxes reach stage two. 21 sequences written; duplicate-id-per-frame count 0. Update time median 0.6 ms, p99 1.4 ms, max 38 active tracks.

---

## Exit Criteria

DONE when tracks for every holdout sequence exist in MOTChallenge format, every parameter is sourced, and tracker time is measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Frames lack order or timestamps | **Stop**: tracking needs sequences; get the sequence data. |
| Phase 2 | Duplicate ids in one frame | **Stop**: fix the integration (usually tracker state shared across sequences). |
| Phase 2 | Tracks die during short occlusions | **Return** to Phase 1 with the evaluation result; change `track_buffer` only through a measured comparison. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
