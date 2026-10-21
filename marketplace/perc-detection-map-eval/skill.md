# Perception Detection mAP Evaluation on Holdout (COCOeval and KITTI Difficulty)

**One-line description:** Runs the deployed engine and postprocessing over every holdout image once, writes detections in the COCO results format, and computes COCO mAP with `pycocotools.cocoeval.COCOeval`, plus per-class AP at KITTI IoU thresholds and difficulty levels when the data came from KITTI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `holdout_annotations` (string, required): Read-only holdout COCO JSON.
- `py_postprocess_impl` (object, optional): Python pipeline, when the stack is Python.
- `cpp_postprocess_impl` (object, optional): C++ pipeline, when the stack is C++. One of the two must be present.
- `label_format` (string, required): "coco" or "kitti"; "kitti" adds the KITTI-style breakdown.

---

## Outputs

- `detection_eval_report` (object): Per engine precision (FP16, INT8): the 12 COCOeval summary values, per-class AP50 and AP50-95, KITTI per-class AP per difficulty when applicable, image count, score threshold used, and paths to the detections files.

---

## Phase 1: Produce Detections

### Entry Criteria
- The pipeline under test is the deployment pipeline (engine plus GPU preprocessing plus postprocessing), not the PyTorch model.
- Holdout file is read-only and its hash matches the split report.

### Actions
1. Set the evaluation score threshold low so the precision-recall curve is complete (Ultralytics uses `conf=0.001` for val; record the value and its source). Keep max detections per image at 100 to match COCOeval's default `maxDets` last value.
2. For every holdout image write records `{"image_id": id, "category_id": cls+1, "bbox": [x1, y1, x2-x1, y2-y1], "score": s}`. COCO results use `[x, y, w, h]`, not corners.
3. Write one file per engine: `dets_fp16.json`, `dets_int8.json`.
4. Do NOT tune thresholds or retrain after seeing these numbers and then report them as holdout results. Any tuning invalidates this set; report it if it happened.

### Output
Detections files.

### Quality Gate
- Every holdout `image_id` appears in the run log (images with zero detections are fine), and every `category_id` is in the categories list.

---

## Phase 2: COCOeval

### Entry Criteria
- Detections written.

### Actions
1. `gt = COCO("holdout.json"); dt = gt.loadRes("dets_fp16.json"); E = COCOeval(gt, dt, "bbox"); E.evaluate(); E.accumulate(); E.summarize()`.
2. `E.stats` holds 12 values: `[0]` AP@[.50:.95], `[1]` AP@.50, `[2]` AP@.75, `[3..5]` AP small, medium, large, `[6..8]` AR at maxDets 1, 10, 100, `[9..11]` AR small, medium, large. Area ranges are COCO's (small below 32 squared pixels, large above 96 squared).
3. Per class: set `E.params.catIds = [c]` and rerun, or slice `E.eval["precision"]` (shape `[T, R, K, A, M]`: IoU thresholds, recall points, classes, areas, maxDets) and average entries greater than -1.
4. Crowd (`iscrowd=1`) regions from KITTI DontCare are ignored automatically.

### Output
COCO metrics per engine.

### Quality Gate
- `E.summarize()` text is saved verbatim for each engine.
- Per-class AP table has one row per class in `categories`.

---

## Phase 3: KITTI-Style Breakdown (label_format == "kitti")

### Entry Criteria
- `label_format` == "kitti" and the annotations carry the `kitti` truncation, occlusion and height fields.

### Actions
1. Apply the KITTI object benchmark difficulty definitions (cvlibs.net KITTI object page): Easy: min box height 40 px, fully visible, max truncation 15%; Moderate: 25 px, partly occluded, 30%; Hard: 25 px, difficult to see, 50%.
2. Use the KITTI 2D IoU thresholds: 0.7 for Car, 0.5 for Pedestrian and Cyclist.
3. Prefer the official devkit `evaluate_object` (C++) or a maintained port, writing results in KITTI 16-field format. If you compute it with COCOeval instead, set `E.params.iouThrs` to the single class threshold and filter ground truth by difficulty, and state that it is an approximation (KITTI uses 40 recall points since 2019, COCOeval uses 101).
4. Report Moderate as the headline, matching KITTI leaderboard convention.

### Output
`detection_eval_report`.

### Quality Gate
- Table with class rows and Easy, Moderate, Hard columns per engine, and the tool used.

---

## Worked Example

Illustrative only. 1131 holdout images. FP16: AP@[.50:.95] 0.498, AP50 0.812. INT8: 0.471, 0.795. KITTI Moderate via devkit: Car 0.874 (FP16) vs 0.861 (INT8); Pedestrian 0.702 vs 0.664. Report includes the verbatim `summarize()` output for both.

---

## Exit Criteria

DONE when every engine has COCOeval summary values and per-class AP on the untouched holdout set, with KITTI difficulty breakdown when applicable and the tool named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Holdout hash changed | **Stop**: the holdout was modified; restore it from the split. |
| Phase 2 | `loadRes` error on image ids | **Adjust** id mapping to the holdout ids and **Retry**. |
| Phase 2 | AP near zero with visible correct boxes | **Return** to Phase 1: likely corners written as `w, h` or class id offset. |
| Phase 3 | Difficulty fields missing | **Return** to the conversion flow to keep the `kitti` fields. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
