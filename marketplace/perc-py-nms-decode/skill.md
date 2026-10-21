# Perception Detection Decode and NMS in Python

**One-line description:** Decodes raw YOLO-style detector output on the GPU (transpose, center to corner boxes, per-class scores), filters by score, runs class-aware non-maximum suppression with `torchvision.ops.batched_nms`, maps boxes back to original image pixels, and checks the result against the framework's own predictor.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `onnx_model` (string, required): The model, read to confirm output layout.
- `py_inference_impl` (object, required): The Python TensorRT runner.
- `preprocess_spec` (object, required): Holds the letterbox inverse transform.
- `nms_iou_threshold` (number, required): IoU threshold for suppression, supplied by the user or copied from the training framework config with its source.
- `score_threshold` (number, required): Minimum class score kept. Supplied by the user for deployment. For mAP evaluation a low threshold is used (see Phase 3).

---

## Outputs

- `py_postprocess_impl` (object): Module path, function signature `postprocess(raw, ratio, pad, orig_hw) -> (boxes_xyxy, scores, classes)`, parity results, and time per frame.

---

## Phase 1: Decode

### Entry Criteria
- Output layout recorded (for YOLOv8 detection: `[1, 4+C, A]`, boxes as `cx, cy, w, h` in network pixels, then C class scores already passed through a sigmoid, no objectness term). Confirm against your model; YOLOv5 layouts differ (`[1, A, 5+C]` with objectness).

### Actions
1. `p = raw[0].transpose(0, 1)` to shape `[A, 4+C]`.
2. `scores, cls = p[:, 4:].max(dim=1)`; keep `m = scores > score_threshold`.
3. Convert kept boxes: `x1 = cx - w/2`, `y1 = cy - h/2`, `x2 = cx + w/2`, `y2 = cy + h/2`.
4. Stay on the GPU. Do NOT call `.cpu()` or `.numpy()` before NMS; the transfer of all anchors costs more than the NMS.

### Output
Candidate boxes, scores and classes on the GPU.

### Quality Gate
- Shapes printed: candidates N x 4, N, N with N less than or equal to A.

---

## Phase 2: Suppress and Map Back

### Entry Criteria
- Candidates exist.

### Actions
1. `keep = torchvision.ops.batched_nms(boxes, scores, cls, nms_iou_threshold)`. `batched_nms` suppresses only within the same class index. Use `torchvision.ops.nms` (class-agnostic) only if the user wants one box per location across classes; record which.
2. Limit kept detections to the maximum the user sets (the framework default if unset, cited from its source).
3. Map back to original pixels with the spec inverse transform: subtract pads, divide by the ratio, clip to the original width and height.
4. Do NOT hand-write an NMS loop in Python; it is slow and a common source of off-by-one IoU errors.

### Output
Final detections.

### Quality Gate
- No two kept boxes of the same class have IoU above `nms_iou_threshold`, checked with `torchvision.ops.box_iou` and printed as the max off-diagonal value.

---

## Phase 3: Parity With the Framework Predictor

### Entry Criteria
- Final detections produced.

### Actions
1. On 20 holdout images run the framework's predictor (`yolo predict model=best.pt source=<img> conf=<score_threshold> iou=<nms_iou_threshold> save_txt=True save_conf=True`) and your pipeline with the same thresholds.
2. Match boxes by IoU with Hungarian assignment (`scipy.optimize.linear_sum_assignment` on `1 - IoU`) and print unmatched counts and minimum matched IoU.
3. For mAP evaluation use a low score threshold so the precision-recall curve is complete; Ultralytics `val` uses `conf=0.001` by default (see its `default.yaml`). Keep the deployment threshold separate.

### Output
`py_postprocess_impl`.

### Quality Gate
- Unmatched box count and minimum matched IoU are printed for all 20 images.

---

## Worked Example

Illustrative only. Output `[1,7,8400]`, 3 classes. `score_threshold=0.25`, `nms_iou_threshold=0.7` copied from Ultralytics `default.yaml` (`conf` predict default and `iou: 0.7`), cited. 8400 anchors to 61 candidates to 7 boxes. Parity with `yolo predict`: 0 unmatched, min IoU 0.994. Time 0.35 ms per frame.

---

## Exit Criteria

DONE when decode and NMS run on the GPU, no same-class pair exceeds the IoU threshold, boxes are in original pixels, and the result matches the framework predictor.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output shape not as recorded | **Stop**: re-read the export; do not guess the layout. |
| Phase 2 | Boxes offset or scaled wrongly | **Adjust** the inverse transform to the spec and **Retry**. |
| Phase 3 | Many unmatched boxes vs predictor | **Return** the per-image diff; check thresholds, class-aware mode and score source. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
