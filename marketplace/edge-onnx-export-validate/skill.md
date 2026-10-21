# Edge ONNX Export and Validation

**One-line description:** Produces a TensorRT-ready ONNX file from a PyTorch model (or validates an existing ONNX file), with named inputs, explicit dynamic axes and a fixed opset, then checks it with onnx.checker, Polygraphy inspection, constant folding and an ONNX Runtime versus PyTorch output comparison.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `model_path` (string, required): Path to a PyTorch checkpoint with its model class importable, or to an existing `.onnx` file.
- `input_shapes` (object, required): Map of input name to shape, with the min, opt and max shapes for any dynamic dimension, for example `{"images": {"min": [1,3,640,640], "opt": [4,3,640,640], "max": [8,3,640,640]}}`.
- `opset_version` (integer, optional): ONNX opset. When absent, use the highest opset that both the exporter and the target TensorRT ONNX parser support, read from the TensorRT release notes' supported-operators page.

---

## Outputs

- `onnx_model` (object): Path to the final ONNX file, its sha256, opset, input and output names with shapes and dtypes, the Polygraphy inspection text, and the maximum absolute difference between ONNX Runtime and PyTorch outputs.

---

## Phase 1: Export or Accept

### Entry Criteria
- `model_path` exists.

### Actions
1. If `model_path` ends in `.onnx`, skip to Phase 2.
2. Export on any machine with the training environment (the ONNX file is portable; the TensorRT engine is not). Use:
   ```
   model.eval()
   dummy = torch.randn(*opt_shape)
   torch.onnx.export(model, dummy, "model.onnx", opset_version=<opset>,
       input_names=["images"], output_names=["output"],
       dynamic_axes={"images": {0: "batch"}, "output": {0: "batch"}})
   ```
3. Name every dynamic dimension in `dynamic_axes`. A dimension left out is frozen at the dummy size.
4. The PyTorch ONNX exporter has two paths (TorchScript-based and `dynamo=True`), and the default differs by torch version. Check `help(torch.onnx.export)` for your installed version and record which path ran.

Do NOT: export with the model in training mode; dropout and batch-norm statistics change the graph.

### Output
`model.onnx`.

### Quality Gate
- `model.onnx` exists and is non-empty.
- Every dynamic dimension listed in `input_shapes` is named in `dynamic_axes`.

---

## Phase 2: Check and Simplify

### Entry Criteria
- An ONNX file exists.

### Actions
1. `python3 -c "import onnx; m=onnx.load('model.onnx'); onnx.checker.check_model(m, full_check=True); print(m.opset_import)"`.
2. `polygraphy inspect model model.onnx --show layers > inspect.txt`. Read the `Inputs` and `Outputs` blocks: names, dtypes and shapes (dynamic dims show as names or `-1`).
3. `polygraphy surgeon sanitize model.onnx --fold-constants -o model_folded.onnx`. Constant folding removes shape-computation subgraphs that TensorRT otherwise must handle.
4. Search `inspect.txt` for ops the TensorRT release notes list as unsupported. Any hit is an open problem for Phase 3 to confirm with an engine build.

### Output
`model_folded.onnx` and `inspect.txt`.

### Quality Gate
- `check_model` raises no exception.
- Input names in `inspect.txt` equal the keys of `input_shapes`.

---

## Phase 3: Compare Outputs

### Entry Criteria
- Folded model exists.

### Actions
1. Run ONNX Runtime and PyTorch on the same fixed input (`torch.manual_seed(0)`; a saved `.npy` from real data is better). For an existing ONNX without PyTorch, compare `model.onnx` against `model_folded.onnx` instead: `polygraphy run model.onnx --onnxrt --save-outputs ref.json` then `polygraphy run model_folded.onnx --onnxrt --load-outputs ref.json`.
2. Record the maximum absolute difference per output.
3. Compute `sha256sum model_folded.onnx`.
4. Assemble `onnx_model` pointing at `model_folded.onnx`.

### Output
`onnx_model`.

### Quality Gate
- The comparison ran and printed a maximum absolute difference for every output.
- Polygraphy's comparison prints `PASSED` for the folded-versus-original check when that path is used.

---

## Worked Example

Illustrative only.

```
$ polygraphy inspect model model.onnx
[I] ==== ONNX Model ====
    Name: main_graph | ONNX Opset: 17
    ---- 1 Graph Input(s) ----
    {images [dtype=float32, shape=('batch', 3, 640, 640)]}
    ---- 1 Graph Output(s) ----
    {output [dtype=float32, shape=('batch', 84, 8400)]}
$ polygraphy surgeon sanitize model.onnx --fold-constants -o model_folded.onnx
[I] Folding Constants | Pass 1
[I]     Total Nodes | Original:   412, After Folding:   298 |   114 Nodes Folded
```
Max abs difference ONNX Runtime versus PyTorch: 3.1e-05.

---

## Exit Criteria

DONE when a checked, constant-folded ONNX file with named dynamic axes and a measured output difference against its source is recorded in `onnx_model`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Exporter raises an unsupported operator error | **Adjust**: try a different `opset_version` the TensorRT parser supports; if still failing, report the op name. |
| Phase 2 | `check_model` fails | **Stop**: do not pass an invalid graph to TensorRT. |
| Phase 2 | Folding fails on a node | **Adjust**: keep the unfolded model and record the node. |
| Phase 3 | Large difference against PyTorch | **Return**: report it; the export is wrong (often a frozen dynamic dimension or training mode). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
