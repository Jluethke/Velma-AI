# Perception ONNX Export and Parity Check

**One-line description:** Exports a trained PyTorch detector to ONNX with a fixed opset and explicit input shape, validates the graph with `onnx.checker`, and proves numerical parity between PyTorch and ONNX Runtime on real holdout images before any TensorRT build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `trained_checkpoint` (string, required): Path to `best.pt` or another PyTorch checkpoint.
- `input_shape` (string, required): Deployment input shape as `NxCxHxW`, for example `1x3x640x640`. State whether the batch dimension must be dynamic.
- `holdout_annotations` (string, required): Read only to choose real images for the parity check. No metric is computed here.

---

## Outputs

- `onnx_model` (string): Path to the exported `.onnx` file.
- `onnx_parity_report` (object): Opset, input and output names and shapes, tolerance used and its source, max absolute difference per output, and the image ids used.

---

## Phase 1: Export

### Entry Criteria
- The checkpoint loads in Python.

### Actions
1. Install `onnx`, `onnxruntime-gpu` (or `onnxruntime`) and `onnxsim` if simplification is wanted. Record versions.
2. Ultralytics checkpoint: `yolo export model=best.pt format=onnx imgsz=640 opset=<opset> dynamic=<True|False> simplify=True`. Plain PyTorch: `torch.onnx.export(model.eval(), dummy, "model.onnx", opset_version=<opset>, input_names=["images"], output_names=["output0"], dynamic_axes={"images": {0: "batch"}, "output0": {0: "batch"}})` only when the batch must be dynamic.
3. Pick the opset as the highest one your TensorRT version's ONNX parser supports (see the TensorRT support matrix for your version). Do not pick an opset because an example used it.
4. Call `model.eval()` before export. Exporting in train mode bakes dropout and batch-norm training behavior into the graph.

### Output
`model.onnx`.

### Quality Gate
- `python -c "import onnx;m=onnx.load('model.onnx');onnx.checker.check_model(m);print([i.name for i in m.graph.input],[o.name for o in m.graph.output])"` exits 0 and prints the names.

---

## Phase 2: Inspect the Graph

### Entry Criteria
- `onnx.checker` passed.

### Actions
1. Run `polygraphy inspect model model.onnx` (from `pip install polygraphy`) and record input and output shapes and dtypes.
2. Confirm the input shape equals `input_shape`, with `batch` symbolic only if requested.
3. For a YOLOv8 detection export, expect output `output0` with shape `[N, 4+num_classes, num_anchors]` (for 640x640: 8400 anchors). Record it; the decode flow depends on this layout.
4. Open the model in Netron (netron.app or `pip install netron`) and confirm there is no NMS node unless you added one deliberately.

### Output
Graph summary.

### Quality Gate
- Recorded input shape equals `input_shape`.
- Output shape and layout are written in the report.

---

## Phase 3: Parity Check on Real Images

### Entry Criteria
- Graph summary recorded.

### Actions
1. Pick 20 image ids from `holdout_annotations` with a fixed seed. Preprocess each with the exact training preprocessing (for Ultralytics: letterbox to 640 with pad value 114, BGR to RGB, HWC to CHW, divide by 255).
2. Run PyTorch and ONNX Runtime (`onnxruntime.InferenceSession("model.onnx", providers=["CUDAExecutionProvider","CPUExecutionProvider"])`) on the same float32 tensors.
3. Compare with `np.abs(a-b).max()` per output. Use the tolerance the user supplies; if none, use Polygraphy's documented defaults by running `polygraphy run model.onnx --onnxrt` against saved PyTorch outputs, or `numpy.testing.assert_allclose` defaults (`rtol=1e-07`, `atol=0`) only as a strict reference. Record which.
4. Do NOT loosen the tolerance to make the check pass. If the difference is large, look for unsupported ops, train-mode export, or a different preprocessing path.

### Output
`onnx_parity_report`.

### Quality Gate
- Max absolute difference per output is printed for all 20 images.
- The tolerance and its source are written in the report.

---

## Worked Example

Illustrative only. `yolo export model=best.pt format=onnx imgsz=640 opset=17 dynamic=False simplify=True` writes `best.onnx`. Inspect prints `images float32 [1,3,640,640]`, `output0 float32 [1,7,8400]` (3 classes). Parity over 20 holdout images: max abs diff 3.1e-04 on box channels, user tolerance 1e-03: pass.

---

## Exit Criteria

DONE when the ONNX graph passes the checker, its input shape matches deployment, and PyTorch to ONNX Runtime parity is measured on real images with a stated tolerance.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsupported operator at export | **Adjust** opset within the TensorRT-supported range and **Retry**; if still failing, **Return** the op name. |
| Phase 2 | Input shape differs from `input_shape` | **Retry** export with the right `imgsz` or dummy input. |
| Phase 3 | Parity fails | **Stop**: do not proceed to TensorRT; report the output and the difference. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
