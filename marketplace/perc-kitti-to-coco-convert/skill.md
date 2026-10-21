# Perception KITTI to COCO Conversion

**One-line description:** Converts KITTI object labels to a single COCO detection JSON with correct box arithmetic, a fixed category id table and DontCare regions kept as crowd ignore regions, or passes an existing COCO file through after a reload check, so every later tool reads one format.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dataset_index` (object, required): Index from `perc-label-format-audit` with image sizes and label paths.
- `label_format` (string, required): "coco" or "kitti".
- `class_list` (string[], required): Target class names, in the order that defines category ids 1..N.

---

## Outputs

- `coco_annotations` (string): Path to a COCO detection JSON with `images`, `annotations` and `categories`, loadable by `pycocotools.coco.COCO`.

---

## Phase 1: Fix the Category Table

### Entry Criteria
- `dataset_index` exists and its audit report has no `blocking` entry.

### Actions
1. Build `categories` as `[{"id": i+1, "name": n} for i, n in enumerate(class_list)]`. Start ids at 1. Some training tools treat id 0 as background.
2. Write the table to the report and keep it fixed for the rest of the project. Changing ids later silently corrupts every saved prediction file.
3. If `label_format` == "coco": load the existing file with `COCO(path)`, confirm its category names equal `class_list` in the same order, and skip to Phase 3. If the names differ, remap `category_id` on every annotation with an explicit old-to-new table and record the table.

### Output
A fixed `categories` list.

### Quality Gate
- `categories` ids are exactly 1..len(`class_list`) with no gaps.
- For COCO input, the remap table (or "identity") is printed.

---

## Phase 2: Convert KITTI Lines

### Entry Criteria
- `label_format` == "kitti".

### Actions
1. For each image in `dataset_index` add `{"id": k, "file_name": rel_path, "width": W, "height": H}` with a unique integer `k`. Use the integer frame number from the file name when unique, so ids are traceable back to `NNNNNN.png`.
2. For each label line with `type` in `class_list`: `x = left`, `y = top`, `w = right - left`, `h = bottom - top`; clip `x, y, x+w, y+h` to the image; `area = w * h`; `iscrowd = 0`.
3. For each `DontCare` line: write one annotation per target class with the same box and `iscrowd = 1`. Never write it as an ordinary (`iscrowd = 0`) box of any class. `pycocotools` COCOeval matches detections that fall on a crowd region as ignored instead of counting them as false positives (see `cocoeval.py`, `iscrowd` handling).
4. Skip lines whose class is not in `class_list` and is not `DontCare`, and count them per class in the report.
5. Keep the KITTI `truncated`, `occluded` and box height in an extra annotation field `kitti` so the KITTI Easy, Moderate and Hard difficulty filters can be applied later.
6. Do NOT round box coordinates to integers. KITTI boxes are sub-pixel floats.

### Output
In-memory COCO dict.

### Quality Gate
- Count of non-crowd annotations equals the audit report's in-class box count minus boxes recorded as degenerate.
- Zero annotations have `w <= 0` or `h <= 0`.

---

## Phase 3: Write and Reload

### Entry Criteria
- COCO dict exists (converted or passed through).

### Actions
1. Write the JSON to a path outside the dataset folder.
2. Reload it: `python -c "from pycocotools.coco import COCO; c=COCO('ann.json'); print(len(c.getImgIds()), len(c.getAnnIds()), c.loadCats(c.getCatIds()))"`.
3. Draw the boxes of five random images with OpenCV `cv2.rectangle` and save the images to a review folder outside the marketplace. Open them and confirm boxes sit on the objects. A half-image shift means `w` and `h` were written as `right` and `bottom`.

### Output
`coco_annotations`.

### Quality Gate
- The reload command prints image and annotation counts equal to Phase 2 counts.
- Five overlay images exist and the user confirmed alignment, or the misalignment is reported.

---

## Worked Example

Illustrative only. KITTI line `Pedestrian 0.00 0 -0.20 712.40 143.00 810.73 307.92 1.89 0.48 1.20 1.84 1.47 8.41 0.01` in image 000000 (1224x370) becomes `{"image_id": 0, "category_id": 2, "bbox": [712.40, 143.00, 98.33, 164.92], "area": 16216.6, "iscrowd": 0}` with `class_list=["Car","Pedestrian","Cyclist"]`. A `DontCare` line becomes three crowd annotations. Reload prints `7481 51865 [{'id': 1, 'name': 'Car'}, ...]`.

---

## Exit Criteria

DONE when one COCO JSON reloads in `pycocotools`, its categories match `class_list` in order, and overlays show boxes aligned with objects.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | COCO category names cannot be mapped to `class_list` | **Stop**: ask the user for the mapping table. |
| Phase 2 | Box clipped to zero area | **Adjust**: drop it and count it as a degenerate box in the report. |
| Phase 3 | Reload count mismatch | **Retry** Phase 2 after finding the skipped lines; do not adjust counts by hand. |
| Phase 3 | Overlays misaligned | **Return** to Phase 2 and check the corner to width conversion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
