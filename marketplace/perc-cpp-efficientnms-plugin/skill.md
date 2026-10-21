# Perception NMS Inside the Engine with EfficientNMS_TRT (C++ Deployment)

**One-line description:** Appends TensorRT's built-in `EfficientNMS_TRT` plugin to the ONNX graph with ONNX GraphSurgeon so decode and suppression run inside the engine, rebuilds the engine, reads its four fixed outputs from C++, and checks parity with the Python reference postprocessing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `onnx_model` (string, required): The model without NMS.
- `cpp_inference_impl` (object, required): The C++ TensorRT runner.
- `preprocess_spec` (object, required): Holds the letterbox inverse transform.
- `nms_iou_threshold` (number, required): IoU threshold, from the user or the training framework config with its source.
- `score_threshold` (number, required): Score threshold, from the user.

---

## Outputs

- `cpp_postprocess_impl` (object): Path to the modified ONNX and rebuilt engine, the plugin attribute values, C++ source that reads the outputs and maps boxes back, and parity results.

---

## Phase 1: Add the Plugin Node

### Entry Criteria
- `pip install onnx-graphsurgeon` (NVIDIA package index or PyPI) succeeds; record version.
- Output layout known (for YOLOv8: `[1, 4+C, A]`, `cx, cy, w, h`, sigmoid scores).

### Actions
1. Load with `graph = gs.import_onnx(onnx.load("model.onnx"))`.
2. Add a `Transpose` to `[1, A, 4+C]`, then two `Slice` nodes: boxes `[1, A, 4]` and scores `[1, A, C]`. The plugin expects boxes `[batch, num_boxes, 4]` and scores `[batch, num_boxes, num_classes]`.
3. Add the node `op="EfficientNMS_TRT"` with attributes from the TensorRT plugin README (`plugin/efficientNMSPlugin/README.md` in the TensorRT OSS repo): `score_threshold`, `iou_threshold`, `max_output_boxes`, `background_class=-1`, `score_activation=0` (scores already sigmoid), `box_coding=1` (center-size `cx, cy, w, h`). Confirm each attribute name and meaning in the README for your version.
4. Declare four outputs: `num_detections` int32 `[1,1]`, `detection_boxes` float32 `[1,max,4]`, `detection_scores` float32 `[1,max]`, `detection_classes` int32 `[1,max]`.
5. `graph.cleanup().toposort()`; `onnx.save(gs.export_onnx(graph), "model_nms.onnx")`.

### Output
`model_nms.onnx`.

### Quality Gate
- `polygraphy inspect model model_nms.onnx` lists the four outputs with the shapes above.

---

## Phase 2: Rebuild and Read Outputs in C++

### Entry Criteria
- Modified ONNX inspected.

### Actions
1. Rebuild with the same `trtexec` flags as the original engine (FP16 or INT8). The plugin is in `libnvinfer_plugin`; trtexec loads it automatically.
2. In the C++ runner call `initLibNvInferPlugins(&logger, "")` before deserialization.
3. Bind the four outputs by name. After the stream syncs, read `n = num_detections[0]` and only the first `n` rows of boxes, scores and classes. Rows past `n` hold stale or zero data.
4. Boxes come out as corners `x1, y1, x2, y2` in network pixels (the plugin always outputs corners). Map them back with the spec inverse transform in C++.

### Output
C++ postprocessing reading the plugin outputs.

### Quality Gate
- The engine build log ends with `&&&& PASSED`.
- For one golden image the C++ program prints `n` and the first box.

---

## Phase 3: Parity With the Python Reference

### Entry Criteria
- C++ outputs readable.

### Actions
1. On 20 holdout images compare the C++ detections with the Python reference (`perc-py-nms-decode` procedure or the framework predictor) using the same thresholds.
2. Match boxes with Hungarian assignment on `1 - IoU`; print unmatched counts and minimum matched IoU.
3. Know a real difference: EfficientNMS defaults to class-aware suppression unless `class_agnostic` is set (check README for your version). Match the reference mode before comparing.
4. Benchmark the new engine with `trtexec --loadEngine` and record the change in `GPU Compute Time` compared to the engine without NMS.

### Output
`cpp_postprocess_impl`.

### Quality Gate
- Unmatched counts and minimum IoU printed for all 20 images.
- Compute time with and without the plugin both recorded.

---

## Worked Example

Illustrative only. Attributes: `score_threshold=0.25`, `iou_threshold=0.7`, `max_output_boxes=100`, `background_class=-1`, `score_activation=0`, `box_coding=1`. Image 000123: `num_detections=7`, first box `(402.1, 251.7, 488.9, 302.4)` network pixels. Parity: 0 unmatched, min IoU 0.989. GPU compute median 2.31 ms without plugin, 2.39 ms with it; host-side NMS removed.

---

## Exit Criteria

DONE when the engine contains EfficientNMS, the C++ code reads only the first `num_detections` rows, maps boxes to original pixels, and matches the Python reference.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shape mismatch on plugin inputs | **Adjust** the Transpose and Slice nodes; **Retry** inspection. |
| Phase 2 | Plugin not found at build | **Return** the TensorRT version; check `libnvinfer_plugin` is on the library path. |
| Phase 3 | Extra boxes vs reference | **Adjust** class-aware mode and thresholds to match the reference, then **Retry**. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
