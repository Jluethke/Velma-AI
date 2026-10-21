# Perception Preprocessing Spec Extraction

**One-line description:** Writes down the exact image preprocessing the model was trained with (resize mode, padding value, color order, layout, scaling, mean and standard deviation, dtype) from the training code and config, and saves golden input tensors that every deployment implementation must reproduce.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `trained_checkpoint` (string, required): The checkpoint being deployed.
- `training_log` (object, required): From the fine-tune flow, with the `args.yaml` path and framework version.
- `onnx_model` (string, required): The exported model; its input name, dtype and shape are read from it.

---

## Outputs

- `preprocess_spec` (object): Ordered steps with exact parameters, the letterbox inverse transform for boxes, the source line in the framework code for each step, and paths to golden input and output tensors (`.npy`).

---

## Phase 1: Read the Training Preprocessing from Source

### Entry Criteria
- The framework version is known from `training_log`.

### Actions
1. Open the installed framework source, not a blog post. For Ultralytics, read `ultralytics/data/augment.py` class `LetterBox` and the predictor `preprocess` method in `ultralytics/engine/predictor.py` for your installed version.
2. Record, each with its source file and line: (a) resize rule (aspect-preserving letterbox vs plain stretch), (b) interpolation flag (for example `cv2.INTER_LINEAR`), (c) pad value and where padding goes (centered split vs bottom-right), (d) color order fed to the network (RGB or BGR), (e) layout (NCHW), (f) scale (for Ultralytics: divide by 255, no mean or std subtraction), (g) dtype (float32 or float16).
3. For torchvision-style models, record `mean` and `std` from the model's weights `transforms()` metadata instead.
4. Do NOT assume ImageNet mean and std. Many detectors use plain 0..1 scaling.

### Output
Draft spec with a citation per step.

### Quality Gate
- Every step (a) to (g) has a value and a source file and line.

---

## Phase 2: Define the Box Inverse Transform

### Entry Criteria
- Draft spec exists.

### Actions
1. Write the formula that maps network-space boxes back to original image pixels. For a centered letterbox with ratio `r = min(H_in/h0, W_in/w0)` and pads `dw = (W_in - round(w0*r))/2`, `dh = (H_in - round(h0*r))/2`: `x_orig = (x_net - dw) / r`, `y_orig = (y_net - dh) / r`, then clip to `[0, w0]` and `[0, h0]`.
2. Confirm rounding of the pad split matches the source (Ultralytics rounds `dw - 0.1` and `dw + 0.1` for left and right; read your version).

### Output
Inverse transform added to the spec.

### Quality Gate
- Applying forward then inverse to the four corners of a test image returns the corners to within one pixel, printed.

---

## Phase 3: Save Golden Tensors

### Entry Criteria
- Spec complete.

### Actions
1. Choose five images of different sizes and aspect ratios (one portrait, one with odd width).
2. Run the framework's own preprocessing on each and save the input tensor with `np.save("golden_in_<k>.npy", t)`.
3. Run ONNX Runtime on each golden input and save outputs as `golden_out_<k>.npy`.
4. Store the golden files outside the marketplace, next to the model, and record their paths and `sha256sum` in the spec.

### Output
`preprocess_spec`.

### Quality Gate
- Five input and five output `.npy` files exist with recorded hashes.
- Each golden input has the exact shape and dtype of the ONNX input.

---

## Worked Example

Illustrative only. Ultralytics 8.x: letterbox to 640, `cv2.INTER_LINEAR`, pad 114 centered, BGR read by OpenCV converted to RGB, HWC to CHW, `/255.0`, float32. Image 1242x375: `r = 0.5153`, new size 640x193, `dh = 223.5`. Golden tensors `golden_in_0.npy` shape `(1,3,640,640)`.

---

## Exit Criteria

DONE when every preprocessing step has a value and a source citation, the inverse box transform round-trips, and golden tensors are saved with hashes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Source for a step not found | **Stop**: report the step as an open question; do not fill it with a common default. |
| Phase 2 | Round trip off by more than one pixel | **Adjust** the pad rounding to match the source and **Retry**. |
| Phase 3 | Framework preprocessing not callable alone | **Adjust**: call its predictor on the image with a hook to capture the input tensor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
