# Export a PyTorch Model to ONNX and Verify with ONNX Runtime

**One-line description:** Exports the calibrated PyTorch model to ONNX with named inputs and a dynamic batch axis, validates it with `onnx.checker`, runs it in ONNX Runtime against eager PyTorch on a golden set, and packages preprocessing alongside it so serving takes the same raw inputs as training.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `torch_calibrated_model` (object, required): From `mlp-torch-temperature-scaling`.
- `tuned_model` (object, required): From `mlp-optuna-search`; provides the model config.
- `feature_pipeline` (object, required): From `mlp-sklearn-feature-pipeline`; tabular preprocessing, if the model uses it.
- `split_manifest` (object, required): From `mlp-split-integrity-check`; golden rows come from test.

---

## Outputs

- `onnx_model_package` (object): Path to `models/model.onnx`, opset version, input and output names and shapes, the preprocessing artifact (ONNX via skl2onnx, or joblib), `golden/inputs.npy` and `golden/expected.npy` from eager PyTorch, versions of torch, onnx and onnxruntime, and the export command used.

---

## Phase 1: Export

### Entry Criteria
- The wrapper model loads: `wrapper.load_state_dict(torch.load("models/calibrated.pt"))` succeeds.
- `python -c "import torch, onnx, onnxruntime; print(torch.__version__, onnx.__version__, onnxruntime.__version__)"` prints versions.

### Actions
1. Put the model in eval mode on CPU: `wrapper.eval().cpu()`.
2. Build a dummy input with the real dtype and shape (batch of 2 so a batch axis of 1 is not baked in): `x = torch.randn(2, C, H, W)` or `torch.randn(2, n_features)`.
3. Choose the opset: the highest that both your torch exporter and your target onnxruntime support. Read the ONNX Runtime compatibility table in its docs; do not pick a number from memory.
4. Export:
   ```python
   torch.onnx.export(
       wrapper, (x,), "models/model.onnx",
       input_names=["input"], output_names=["logits"],
       dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
       opset_version=OPSET,
   )
   ```
   Newer torch versions also offer `torch.onnx.export(..., dynamo=True)` with `dynamic_shapes`; check the torch.onnx docs for your version and use one exporter consistently.
5. Output is logits divided by temperature (the buffer is exported as a constant). Apply softmax in serving, or add `torch.softmax` in a final wrapper before export so the ONNX output is probabilities; record which.
6. Validate the file: `onnx.checker.check_model(onnx.load("models/model.onnx"))`.

### Output
`models/model.onnx`.

### Quality Gate
- `check_model` raises nothing.
- `python -c "import onnx; m=onnx.load('models/model.onnx'); print([i.name for i in m.graph.input], [o.name for o in m.graph.output])"` prints `['input'] ['logits']` (or `probs`).

---

## Phase 2: Package Preprocessing

### Entry Criteria
- Export valid.

### Actions
1. Decide where preprocessing lives:

| Model input | Preprocessing |
|---|---|
| Images or audio with fixed transforms | Implement the same transforms in the serving code from one shared module; record the exact constants (mean, std, resize) in the package metadata |
| Tabular via the scikit-learn feature pipeline | Convert with skl2onnx: `from skl2onnx import to_onnx; onx = to_onnx(fitted_pre, X_sample[:1])`, save `models/preprocess.onnx`. Not every transformer is supported (check the skl2onnx supported list); if one is not, ship `preprocess.joblib` and run it in Python |

2. Never re-implement preprocessing by hand in another language without a parity test; it is the most common source of training-serving skew.

### Output
Preprocessing artifact.

### Quality Gate
- If skl2onnx was used: running `preprocess.onnx` on 100 raw rows gives the same array as `fitted_pre.transform` within the tolerance from `tolerance_spec` in `mlp-inference-parity-test` (float32 conversion means exact equality is not expected).

---

## Phase 3: Runtime Check and Golden Set

### Entry Criteria
- Model and preprocessing artifacts exist.

### Actions
1. Golden inputs: a seeded sample of test rows (size a user input) plus edge cases (batch of 1, the largest batch the service allows). Save `golden/inputs.npy`.
2. Eager output: `expected = wrapper(torch.from_numpy(golden)).detach().numpy()`; save `golden/expected.npy`.
3. Runtime output:
   ```python
   import onnxruntime as ort
   sess = ort.InferenceSession("models/model.onnx", providers=["CPUExecutionProvider"])
   got = sess.run(None, {"input": golden.astype(np.float32)})[0]
   print(np.max(np.abs(got - expected)), (got.argmax(1) == expected.argmax(1)).mean())
   ```
4. Record the max absolute difference and argmax agreement. The tolerance decision belongs to `mlp-inference-parity-test`; record the numbers here.
5. Check the batch-1 row and the same row inside the large batch give the same output (batch-dependent output points to batch norm left in training mode).
6. Fill `onnx_model_package`.

### Output
`onnx_model_package`.

### Quality Gate
- The max difference and argmax agreement are recorded for the golden set.
- Batch-1 and in-batch outputs for the same row are printed side by side.

---

## Worked Example

Illustrative only.

```
$ python src/export_onnx.py --opset 17
check_model: OK
inputs ['input']  outputs ['logits']
$ python src/ort_check.py
golden rows: 256   max abs diff: 2.3e-06   argmax agreement: 1.0
row 17 batch1: [ 1.912 -0.443 ...]  in-batch: [ 1.912 -0.443 ...]
```
Opset 17 chosen after checking the ONNX Runtime table for the installed version.

---

## Exit Criteria

DONE when `model.onnx` passes the checker, ONNX Runtime output and eager output are recorded on a golden set, preprocessing is packaged with the model, and batch independence is confirmed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Unsupported ONNX opset` or unsupported operator | **Adjust**: try the other exporter path (`dynamo=True` or legacy), or a supported opset; record which works. |
| Phase 1 | Output shape fixed to batch 2 | **Adjust**: add `dynamic_axes` (or `dynamic_shapes`) for axis 0. |
| Phase 2 | skl2onnx raises "Unable to find a shape calculator" | **Adjust**: that transformer is unsupported; ship `preprocess.joblib`. |
| Phase 3 | Batch-1 output differs from in-batch | **Return**: export was done in training mode; call `eval()` and re-export. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
