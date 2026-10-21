# Perception GPU Preprocessing in Python (PyTorch)

**One-line description:** Implements the recorded preprocessing spec on the GPU with PyTorch tensor ops (letterbox resize, pad, color swap, layout change, scaling) on a dedicated CUDA stream, and proves it matches the golden tensors before it is used for inference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `preprocess_spec` (object, required): From `perc-preprocess-spec-extract`, with golden tensor paths.
- `holdout_annotations` (string, required): Used only to pick extra images for the parity test.

---

## Outputs

- `py_preprocess_impl` (object): Path to the module and function (`preprocess(img_uint8_hwc_bgr_cuda) -> (tensor_nchw, ratio, pad)`), the parity results per golden image, and the measured time per frame.

---

## Phase 1: Implement

### Entry Criteria
- `torch.cuda.is_available()` is True.
- The spec has no open questions.

### Actions
1. Decode the image on the CPU with `cv2.imread` (BGR uint8) or on the GPU with `torchvision.io.decode_jpeg(data, device="cuda")` (returns RGB CHW uint8; check your torchvision version supports device decode). Record which; the color order changes.
2. Upload once: `t = torch.from_numpy(img).pin_memory().cuda(non_blocking=True)` when decoding on CPU. Pinned memory is required for an asynchronous copy.
3. Implement each spec step in order with tensor ops: `permute(2,0,1)`, `flip(0)` for BGR to RGB, `torch.nn.functional.interpolate(x[None].float(), size=(nh,nw), mode="bilinear", align_corners=False)`, `torch.nn.functional.pad(..., value=pad_value)` with the exact left, right, top, bottom split, then `/255.0`.
4. Know the mismatch: OpenCV `INTER_LINEAR` and PyTorch `bilinear` with `align_corners=False` are close but not bit-identical, and `antialias` defaults differ by version. The parity test decides whether the difference is acceptable.
5. Run all ops inside `with torch.cuda.stream(s):` on one stream created once at startup.

### Output
A preprocessing module.

### Quality Gate
- `python -c "import <module>"` succeeds and a call on one image returns shape and dtype equal to the ONNX input.

---

## Phase 2: Parity Against Golden Tensors

### Entry Criteria
- Module imports.

### Actions
1. For each golden image, compute `d = (impl(img) - torch.from_numpy(golden).cuda()).abs()` and print `d.max()` and `d.mean()`.
2. Then run ONNX Runtime or the TensorRT engine on both inputs and compare decoded detections after NMS: count boxes and IoU per matched box. Input-level differences only matter if they change outputs.
3. Accept only against a tolerance the user supplies. Do not raise the tolerance to pass; instead switch the resize to the exact OpenCV path (`cv2.cuda.resize` from an OpenCV CUDA build, or CPU `cv2.resize` then upload) and remeasure.

### Output
Parity table.

### Quality Gate
- Max and mean input difference printed for all five golden images.
- Detection count and per-box IoU after NMS printed for each.

---

## Phase 3: Time It

### Entry Criteria
- Parity accepted.

### Actions
1. Time with CUDA events: `a=torch.cuda.Event(enable_timing=True); b=...; a.record(s); impl(img); b.record(s); b.synchronize(); a.elapsed_time(b)` in milliseconds.
2. Discard warm-up iterations (first calls include CUDA context and kernel load). Record the warm-up count used.
3. Report median and p99 with `numpy.percentile` over the iteration count the user chooses.

### Output
`py_preprocess_impl`.

### Quality Gate
- Timing table lists iterations, warm-up count, median and p99.

---

## Worked Example

Illustrative only. 1242x375 JPEG, CPU decode, pinned upload, GPU letterbox to 640. Input diff vs golden: max 1/255 (0.0039), mean 2e-05. After NMS: same 7 boxes, min IoU 0.998. Timing over 1000 iterations after 50 warm-up: median 0.41 ms, p99 0.58 ms.

---

## Exit Criteria

DONE when the GPU preprocessing reproduces the golden outputs within the user tolerance and its time per frame is measured with CUDA events.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Device JPEG decode unsupported | **Adjust**: CPU decode plus pinned upload. |
| Phase 2 | Detections differ after NMS | **Stop**: find the step (print the diff after each step) and fix it; do not ship. |
| Phase 3 | High timing variance | **Retry** with GPU clocks noted (`nvidia-smi -q -d CLOCK`) and other GPU work stopped. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
