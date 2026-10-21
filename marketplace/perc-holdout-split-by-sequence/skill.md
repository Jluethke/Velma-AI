# Perception Holdout Split by Sequence

**One-line description:** Splits a COCO detection dataset into train, validation and held-out test sets by recording sequence (drive, scene or log id) rather than by frame, so near-duplicate consecutive frames never leak across sets, and proves the split with a leakage check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `coco_annotations` (string, required): COCO JSON from `perc-kitti-to-coco-convert`.
- `sequence_key` (string, optional): Name of the per-image field that holds the drive or scene id (for example `drive` from KITTI mapping files, or a log name). When absent, the flow derives groups from file name prefixes or stops.
- `holdout_fraction` (number, required): Fraction of sequences reserved for the held-out test set, chosen by the user. This flow does not pick it.

---

## Outputs

- `train_annotations` (string): COCO JSON for training.
- `val_annotations` (string): COCO JSON for model selection during training (early stopping, threshold tuning).
- `holdout_annotations` (string): COCO JSON for the final, one-time measurement. Never used for tuning.
- `split_report` (object): Sequences per set, images and boxes per class per set, the random seed, and the leakage check result.

---

## Phase 1: Build Sequence Groups

### Entry Criteria
- `coco_annotations` reloads in `pycocotools`.
- `holdout_fraction` is between 0 and 1, exclusive.

### Actions
1. Load the JSON with `json.load`. For each image read `sequence_key`. If `sequence_key` is absent, check the file names: if they share a scene prefix (for example `scene-0061_CAM_FRONT_...`), group by that prefix and record the regex used.
2. If no grouping exists (KITTI object without mapping files, random frame names), **Stop** and report: a frame-level random split of video-derived frames puts near-identical frames in train and test, and the measured mAP is then inflated. Ask the user for the drive list.
3. Count images and boxes per class per group.

### Output
A group table: group id, image count, per-class box count.

### Quality Gate
- Every image belongs to exactly one group; print `sum(group sizes) == len(images)`.

---

## Phase 2: Assign Groups to Sets

### Entry Criteria
- Group table exists with two or more groups.

### Actions
1. Fix a random seed, record it, and shuffle the group ids with `random.Random(seed).shuffle(ids)`.
2. Take groups for the holdout set until its image count reaches `holdout_fraction` of all images. Take the validation set the same way using the fraction the user gives for validation (ask if not given; do not invent one).
3. Check that every class in `categories` has one or more boxes in each set. If a class is missing from holdout, swap a group containing it from train to holdout and record the swap. Do not move single frames.
4. Write the three JSON files, each with the full `categories` list and only its own `images` and `annotations`.

### Output
`train_annotations`, `val_annotations`, `holdout_annotations`.

### Quality Gate
- Every class has a non-zero box count in each set, printed as a table.
- Re-running with the same seed yields byte-identical files (`sha256sum` matches).

---

## Phase 3: Prove There Is No Leakage

### Entry Criteria
- Three files written.

### Actions
1. Compute the set intersection of group ids and of image `file_name` values between each pair of sets. Both must be empty.
2. Compute a perceptual hash of every image (`pip install imagehash`, `imagehash.phash(Image.open(p))`) and list cross-set pairs with Hamming distance 0. Report the count; exact duplicates across sets are a leakage defect to fix by moving the whole group.
3. Write `split_report` with seed, set sizes, per-class counts, intersections and duplicate count.
4. Mark the holdout file read-only (`chmod a-w holdout.json`, or the file Properties dialog on Windows). Downstream flows only read it.

### Output
`split_report`.

### Quality Gate
- Group and file name intersections are empty sets, printed.
- Cross-set exact-duplicate count is 0, or each pair is listed as a defect.

---

## Worked Example

Illustrative only. 7481 KITTI frames grouped by `drive` from `train_mapping.txt` into 71 drives. `holdout_fraction=0.15`, validation fraction 0.10 given by the user, seed 1234. Holdout gets 10 drives (1131 images), val 8 drives (742), train 53 drives (5608). Cyclist was missing from val, so drive `2011_09_26_drive_0009_sync` was swapped in from train. Intersections empty; phash duplicates 0.

---

## Exit Criteria

DONE when three COCO files exist, each class appears in each set, no group or image appears in two sets, and the seed is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No sequence information | **Stop**: request drive or scene ids; never fall back to a random frame split. |
| Phase 2 | Too few groups to cover every class in every set | **Return** the per-class group table; more data or a class merge is needed. |
| Phase 3 | Cross-set duplicates found | **Adjust**: move the whole group, then **Retry** Phase 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
