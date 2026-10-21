# Perception Tracking Evaluation (MOTA, IDF1, HOTA) with TrackEval

**One-line description:** Evaluates tracker output against held-out tracking ground truth with the TrackEval reference code, reporting CLEAR MOT (MOTA, MOTP), Identity (IDF1) and HOTA per sequence and combined, and explains each number from its component counts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `track_outputs` (string, required): Folder of MOTChallenge-format tracker files.
- `tracking_gt` (string, required): Ground truth for the same sequences in MOTChallenge format (`gt/gt.txt` per sequence plus `seqinfo.ini`), from the holdout split.

---

## Outputs

- `tracking_eval_report` (object): Per sequence and combined: MOTA, MOTP, IDF1, HOTA, DetA, AssA, and the raw counts (GT objects, FP, FN, ID switches), plus the TrackEval commit and command line.

---

## Phase 1: Lay Out Files for TrackEval

### Entry Criteria
- Ground truth sequences equal the tracker sequences, by name.

### Actions
1. `git clone https://github.com/JonathonLuiten/TrackEval` and record the commit (`git rev-parse HEAD`). `pip install numpy scipy`.
2. Arrange ground truth as `data/gt/mot_challenge/<BENCH>-<SPLIT>/<seq>/gt/gt.txt` with `seqinfo.ini` (keys `seqLength`, `frameRate`, `imWidth`, `imHeight`), and a seqmap file `data/gt/mot_challenge/seqmaps/<BENCH>-<SPLIT>.txt` with header `name` then one sequence per line.
3. Arrange tracker output as `data/trackers/mot_challenge/<BENCH>-<SPLIT>/<tracker_name>/data/<seq>.txt`.
4. Check the ground truth class and visibility columns. In MOT17 format, column 7 is the "consider" flag and column 8 the class; TrackEval's MOT challenge loader filters by class and ignores distractor classes. For custom data with other classes, read `trackeval/datasets/mot_challenge_2d_box.py` to see how classes are filtered, or use the `--CLASSES_TO_EVAL` option it exposes.

### Output
Folders in TrackEval layout.

### Quality Gate
- `ls` shows one gt file and one tracker file per sequence named in the seqmap.

---

## Phase 2: Run the Evaluation

### Entry Criteria
- Layout done.

### Actions
1. Run: `python scripts/run_mot_challenge.py --BENCHMARK <BENCH> --SPLIT_TO_EVAL <SPLIT> --TRACKERS_TO_EVAL <tracker_name> --METRICS HOTA CLEAR Identity --USE_PARALLEL False --GT_FOLDER data/gt/mot_challenge --TRACKERS_FOLDER data/trackers/mot_challenge`. Check `--help` for the exact options in your commit.
2. Save the console output and the `pedestrian_summary.txt` (or per-class summary) files it writes.
3. Do NOT reimplement MOTA by hand for the report. If you cross-check with `py-motmetrics`, note that its `mm.distances.iou_matrix(..., max_iou=0.5)` returns distances (1 - IoU), so its MOTP is a distance where lower is better.

### Output
TrackEval summaries.

### Quality Gate
- Summary file exists with HOTA, MOTA and IDF1 columns for every sequence and a COMBINED row.

---

## Phase 3: Explain the Numbers

### Entry Criteria
- Summaries exist.

### Actions
1. Recompute MOTA from the printed counts to confirm the definition: `MOTA = 1 - (FN + FP + IDSW) / GT` (Bernardin and Stiefelhagen, 2008). MOTA can be negative.
2. Split the error: if FN dominates, the detector misses objects; if IDSW dominates, association is the problem; HOTA's DetA vs AssA shows the same split (Luiten et al., 2021, IJCV).
3. Pick the three worst sequences by HOTA and write one line each naming the dominant count.

### Output
`tracking_eval_report`.

### Quality Gate
- Recomputed MOTA equals the reported MOTA to the printed precision for the COMBINED row.
- Each of the three worst sequences has its dominant error type named with the count.

---

## Worked Example

Illustrative only. 21 KITTI tracking sequences converted to MOT format. COMBINED: HOTA 62.4, DetA 63.1, AssA 62.0, MOTA 71.8, IDF1 76.9, GT 9218, FP 912, FN 1431, IDSW 254. Check: 1 - (1431+912+254)/9218 = 0.718. Worst: seq 0013 (FN 288, heavy occlusion), 0016, 0019.

---

## Exit Criteria

DONE when TrackEval produced HOTA, CLEAR and Identity metrics for every sequence, MOTA is cross-checked from counts, and the dominant error per worst sequence is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sequence names differ | **Adjust** the seqmap to the exact names; never drop sequences silently. |
| Phase 2 | TrackEval rejects a frame index | **Return** to the tracking flow; frames must start at 1. |
| Phase 3 | Recomputed MOTA mismatch | **Stop**: check which class the summary is for and which ground truth rows were filtered. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
