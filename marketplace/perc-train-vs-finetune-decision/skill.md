# Perception Train vs Fine-Tune Decision

**One-line description:** Decides with an explicit rule table whether to use a pretrained detector as is, fine-tune it, or train from scratch, based on class coverage, input modality, weight license and a measured zero-shot baseline on the validation set, and writes a training plan with the experiments to run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `split_report` (object, required): From `perc-holdout-split-by-sequence`, with per-class box counts per set.
- `class_list` (string[], required): Target classes.
- `pretrained_candidates` (object[], required): Each candidate: framework, model name or checkpoint path (for example Ultralytics `yolov8s.pt`), the dataset it was trained on, its license, and its input modality.
- `accuracy_target` (object, required): The user's acceptance target, for example a COCO AP or a per-class AP50 on holdout. Supplied by the user or the product requirement, never invented here.

---

## Outputs

- `training_plan` (object): Chosen path ("use_as_is", "fine_tune", "from_scratch"), the candidate, the experiments (each with frozen layers, image size, epochs and seed), and the reason per rule.

---

## Phase 1: Screen the Candidates

### Entry Criteria
- Every candidate has a license entry.

### Actions
1. Drop any candidate whose weight license the user cannot accept for the product. Example: Ultralytics YOLO code and weights are AGPL-3.0 unless an enterprise license is bought; record this and ask the user. Do not decide license questions yourself.
2. Drop any candidate whose input modality differs from the sensor (RGB vs thermal vs grayscale channel count) unless the user accepts training from scratch.
3. For each remaining candidate list which `class_list` entries exist in its training label space (for example COCO has "car", "person", "bicycle", but no "cyclist" as one class).

### Output
A screened candidate table with class coverage.

### Quality Gate
- Every dropped candidate has a written reason (license or modality).

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- One or more candidates survive Phase 1.

### Actions
1. Apply the first matching row:

| Condition | Path |
|---|---|
| All target classes exist in the pretrained label space, and a zero-shot run on `val_annotations` meets `accuracy_target` | use_as_is |
| Pretrained weights exist for the same modality, and any class is missing or the zero-shot result misses the target | fine_tune |
| No license-acceptable weights, or modality has no pretrained weights | from_scratch |

2. For the zero-shot run, map pretrained class names to target names with an explicit table (for example COCO "person" to "Pedestrian"), then measure with the same COCOeval procedure used in `perc-detection-map-eval` on validation only. Never use holdout here.
3. Record the zero-shot numbers in the plan even when fine-tuning is chosen; they are the baseline the fine-tuned model must beat.

### Output
The chosen path with its matched row.

### Quality Gate
- The plan cites the matched table row and the measured zero-shot number on validation.

---

## Phase 3: Define the Experiments

### Entry Criteria
- Path is "fine_tune" or "from_scratch".

### Actions
1. Define a minimum of two experiments to compare on validation: (a) full fine-tune, (b) frozen backbone (Ultralytics `freeze=N` freezes the first N layers; read the model YAML to find the backbone layer count). Do not assume which wins; it is measured.
2. Fix image size equal to the deployment input size. Training at one size and deploying at another changes accuracy; if they must differ, add a validation run at the deployment size.
3. Record a seed per experiment. Ask the user for the epoch count or use the framework documented default, and record which.
4. Do NOT put the holdout set in any experiment.

### Output
`training_plan`.

### Quality Gate
- Each experiment lists frozen layers, image size, epochs, seed and data YAML path.
- No experiment references `holdout_annotations`.

---

## Worked Example

Illustrative only. Candidates `yolov8s.pt` (COCO, AGPL-3.0) and a torchvision `fasterrcnn_resnet50_fpn_v2` (COCO weights, BSD-3-Clause code; user checked weight terms). User accepts AGPL for internal research. Zero-shot `yolov8s.pt` on val with mapping car to Car, person to Pedestrian: AP50 Car 0.61, Pedestrian 0.44, Cyclist not present. Row 2 matches: fine_tune. Experiments: E1 full, E2 `freeze=10`, both `imgsz=640`, seed 0.

---

## Exit Criteria

DONE when the plan names one path from the table, cites the measured zero-shot baseline on validation, and lists experiments that never touch holdout.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | License unknown | **Stop**: ask the user; do not assume permissive terms. |
| Phase 2 | Zero-shot run impossible (no class overlap) | **Adjust**: skip zero-shot and record "no overlap" as the reason for row 2. |
| Phase 3 | User wants holdout used for tuning | **Stop**: explain the measurement would be biased; propose a larger validation set instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
