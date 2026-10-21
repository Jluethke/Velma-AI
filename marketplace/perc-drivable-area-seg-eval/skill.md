# Perception Drivable-Area Segmentation Evaluation (mIoU)

**One-line description:** Evaluates a drivable-area or road segmentation model on a held-out set by accumulating a confusion matrix over every pixel at label resolution, with the ignore index honored and nearest-neighbor resizing of class maps, and reports per-class IoU and mIoU.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `seg_model` (string, required): Path to the deployed segmentation engine or ONNX model, with its preprocessing spec.
- `seg_holdout_dir` (string, required): Held-out images and label maps (single-channel PNG class ids), split by sequence like the detection data.
- `seg_label_spec` (object, required): Class id to name table, the ignore id, and the dataset documentation it came from (for example the BDD100K drivable-area label description).

---

## Outputs

- `seg_eval_report` (object): Confusion matrix, per-class IoU, mIoU, pixel accuracy, image count, and the resize method used.

---

## Phase 1: Confirm the Label Encoding

### Entry Criteria
- `seg_label_spec` cites its source documentation.

### Actions
1. Load five label PNGs with `np.array(Image.open(p))` and print `np.unique` values. Every value must be a class id or the ignore id from the spec.
2. Confirm label maps are single-channel class ids, not color-coded RGB images. BDD100K ships both forms for drivable area; use the id masks and confirm the id meaning in its documentation (for example direct, alternative, background).
3. Record the label resolution.

### Output
Confirmed encoding.

### Quality Gate
- Unique values printed for five labels, all in the spec.

---

## Phase 2: Run and Accumulate

### Entry Criteria
- Encoding confirmed.

### Actions
1. Run the model on every holdout image with its exact preprocessing; take `argmax` over the class channel.
2. Undo letterbox padding, then resize the predicted class map to label resolution with `cv2.resize(pred, (W, H), interpolation=cv2.INTER_NEAREST)`. Never bilinear on class ids; it creates ids that do not exist. Alternatively upsample the logits bilinearly first and then `argmax`; record which.
3. Accumulate `cm += np.bincount(C * gt[m] + pred[m], minlength=C*C).reshape(C, C)` with `m = gt != ignore_id`.
4. Do not average per-image IoU; accumulate over the whole set (the standard for Cityscapes-style mIoU).

### Output
Confusion matrix.

### Quality Gate
- `cm.sum()` equals the count of non-ignored ground truth pixels, both printed.

---

## Phase 3: Compute Metrics

### Entry Criteria
- Confusion matrix complete.

### Actions
1. `IoU_c = cm[c,c] / (cm[c,:].sum() + cm[:,c].sum() - cm[c,c])`; mIoU is the mean over classes with ground truth pixels.
2. Pixel accuracy `= trace(cm) / cm.sum()`; report it but do not use it alone, since background dominates.
3. Save 10 overlay images of the worst images by per-image IoU of the main drivable class for review.

### Output
`seg_eval_report`.

### Quality Gate
- Per-class IoU table and mIoU printed with the image count.
- Ten worst overlays saved and listed by file name.

---

## Worked Example

Illustrative only. BDD100K-style ids `{0: direct, 1: alternative, 2: background}` confirmed in five labels. 1000 holdout images at 1280x720, predictions resized with `INTER_NEAREST`. IoU direct 0.842, alternative 0.611, background 0.968; mIoU 0.807. Worst images: night rain with glare.

---

## Exit Criteria

DONE when mIoU and per-class IoU are computed from one confusion matrix over all non-ignored holdout pixels at label resolution.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Labels are RGB color masks | **Adjust**: convert with the documented palette table, cited, then **Retry**. |
| Phase 2 | Shape mismatch after resize | **Return** to the letterbox inverse in the preprocessing spec. |
| Phase 3 | A class has zero ground truth pixels | **Adjust**: exclude it from the mean and say so in the report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
