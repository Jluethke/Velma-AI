# Perception Label Format Audit (COCO and KITTI)

**One-line description:** Parses every label file of a camera detection dataset in its declared format (COCO JSON or KITTI 15-field text), checks each box against the image bounds and the class list, and produces an index of images and a defect report before any conversion or training.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dataset_dir` (string, required): Root directory of the dataset. For COCO: an images folder plus one annotations JSON. For KITTI object: `training/image_2/` and `training/label_2/`.
- `label_format` (string, required): Either "coco" or "kitti". No other value is accepted.
- `class_list` (string[], required): The exact class names the product needs, spelled as they appear in the labels (KITTI names are case sensitive, for example "Car", "Pedestrian", "Cyclist").

---

## Outputs

- `dataset_index` (object): One row per image: relative image path, width, height, label file path (KITTI) or image id (COCO), box count per class, and a sequence or drive id when one is known.
- `label_audit_report` (object): Counts per class, count of images with zero boxes, and a defect list. Each defect names the file, the line or annotation id, the rule broken, and the raw value.

---

## Phase 1: Parse Labels in the Declared Format

### Entry Criteria
- `label_format` is exactly "coco" or "kitti".
- `dataset_dir` exists and is readable.

### Actions
1. Create a Python virtual environment outside the dataset folder and install `pycocotools`, `numpy` and `Pillow` (`pip install pycocotools numpy Pillow`). Do not write any scratch file inside `dataset_dir`.
2. If `label_format` == "coco":
   1. Load the file with `from pycocotools.coco import COCO; gt = COCO(path)`. A parse error here is a Phase 1 failure; do not hand-edit the JSON to make it load.
   2. Read `gt.dataset["images"]`, `gt.dataset["annotations"]`, `gt.dataset["categories"]`. Each annotation `bbox` is `[x, y, width, height]` in absolute pixels with the origin at the top-left corner (COCO data format spec, cocodataset.org/#format-data).
3. If `label_format` == "kitti":
   1. For each `label_2/NNNNNN.txt`, split each line on whitespace. A ground-truth line has exactly 15 fields: `type truncated occluded alpha left top right bottom height width length x y z rotation_y` (KITTI object devkit `readme.txt`). A result file line has 16 (an extra score); a 16-field line in ground truth is a defect.
   2. The 2D box is `left top right bottom` in pixels (corner format, not width and height).
   3. Keep `DontCare` lines; they mark regions that must not be scored as false positives.
4. Open each image with `PIL.Image.open(p).size` to get the true width and height. Do not trust a width or height written in the label file without this check.
5. If the KITTI devkit mapping files (`mapping/train_mapping.txt`, `mapping/train_rand.txt`) are present, record the raw drive name for each frame as its sequence id. If they are absent, leave the sequence id empty and record that in the report.

### Output
A parsed in-memory table of every image and every box, with true image sizes.

### Quality Gate
- The number of parsed images equals `ls` count of image files (or the length of `images` for COCO); print both numbers.
- Zero KITTI ground-truth lines have a field count other than 15 without being listed as a defect.

---

## Phase 2: Check Every Box and Class

### Entry Criteria
- Phase 1 table exists.

### Actions
1. For every box compute corners `x1, y1, x2, y2` (COCO: `x2 = x + w`, `y2 = y + h`).
2. Record a defect when any of these is true: `x2 <= x1` or `y2 <= y1` (degenerate box); `x1 < 0` or `y1 < 0` or `x2 > width` or `y2 > height` (out of image); a NaN or non-numeric field.
3. Record a defect when a class name (KITTI `type`) or COCO `category_id` does not map to `class_list`, except KITTI `DontCare`, which is kept as an ignore region. Do not silently drop unknown classes; list them with counts so the user decides the mapping.
4. For COCO, record a defect for any annotation whose `image_id` is not in `images`, and for any duplicate annotation `id`.
5. Count boxes per class and the number of images with zero boxes.

### Output
Draft `label_audit_report` with every defect.

### Quality Gate
- Every defect row has file, line or annotation id, rule, and raw value.
- Per-class counts sum to the total box count printed in Phase 1.

---

## Phase 3: Emit the Index

### Entry Criteria
- Phase 2 finished.

### Actions
1. Write `dataset_index` as JSON Lines to a path outside `dataset_dir` that the user chooses.
2. Write `label_audit_report` as JSON with three keys: `class_counts`, `empty_images`, `defects`.
3. If any class in `class_list` has zero boxes, add a top-level `blocking` entry naming it. A model cannot be evaluated on a class with no holdout boxes.
4. Do NOT fix labels in this flow. Fixes are a labeling task; this flow only reports.

### Output
`dataset_index`, `label_audit_report`.

### Quality Gate
- `python -c "import json;[json.loads(l) for l in open('index.jsonl')]"` exits 0.
- The report has a `defects` list (possibly empty) and a `blocking` key when a class has zero boxes.

---

## Worked Example

Illustrative only. Input: `dataset_dir=/data/kitti_object`, `label_format=kitti`, `class_list=["Car","Pedestrian","Cyclist"]`.

- Phase 1: 7481 label files parsed, 7481 images found. Mapping files present, so each frame gets its drive name, for example `2011_09_26_drive_0005_sync`.
- Phase 2: line `Car 0.00 0 -1.57 712.40 143.00 810.73 307.92 1.89 1.65 4.08 2.70 1.66 15.03 -1.54` passes. Defects: 2 boxes with `right > 1242` (image width 1242), and 1 class `Person_sitting` (not in `class_list`, 222 boxes) reported for a mapping decision.
- Phase 3: `index.jsonl` and `audit.json` written; `blocking` absent because all three classes have boxes.

---

## Exit Criteria

DONE when every image and every box was parsed in the declared format, every rule violation is listed with its file and raw value, and the index is written as valid JSON Lines.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `label_format` is not "coco" or "kitti" | **Stop**: ask the user for the format; do not guess from file extensions. |
| Phase 1 | COCO JSON fails to load in `pycocotools` | **Return** the exception text as a blocking defect; do not edit the JSON by hand. |
| Phase 1 | Image file missing for a label | **Adjust**: record a defect for that label and continue with the rest. |
| Phase 2 | Many unknown class names | **Return** the list with counts and ask for an explicit mapping table. |
| Phase 3 | A required class has zero boxes | **Stop**: report `blocking`; more labels are needed before training. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
