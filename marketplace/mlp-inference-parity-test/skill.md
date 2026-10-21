# Inference Parity Tests Between Training and Serving

**One-line description:** Writes a pytest suite that loads the packaged model through the serving path (MLflow pyfunc or ONNX Runtime) and asserts its output on the golden set matches the training-time object within a stated tolerance, plus schema, batch-size and edge-input checks, and runs it in CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sklearn_model_package` (object, optional): From `mlp-sklearn-mlflow-model-package`.
- `onnx_model_package` (object, optional): From `mlp-torch-onnx-export`.
- `tolerance_spec` (object, optional): `rtol` and `atol` for float comparisons and whether argmax agreement must be exact, chosen by the user. When absent, the rule in Phase 1 applies.
- `repo_path` (string, required): Repository root where `tests/` lives.

---

## Outputs

- `parity_report` (object): Package tested, serving path, tolerance used and its source (`tolerance_spec`, exact rule, or open question), per-test pass/fail, max absolute and relative difference observed, the pytest command, and the mutation check result.

---

## Phase 1: Fix the Tolerance

### Entry Criteria
- Exactly one of `sklearn_model_package` or `onnx_model_package` is present (or both, tested separately).

### Actions
1. Choose with this table; the first matching row wins:

| Situation | Comparison |
|---|---|
| `tolerance_spec` provided | `np.testing.assert_allclose(got, expected, rtol=spec.rtol, atol=spec.atol)` |
| Same runtime and same library versions as training (MLflow pyfunc of a scikit-learn pipeline) | Exact: `np.testing.assert_array_equal` |
| Different runtime or dtype (ONNX Runtime, float32, GPU) and no `tolerance_spec` | Record an open question asking the user for `rtol`/`atol`; meanwhile assert exact argmax agreement for classifiers and report the observed max difference. Do not invent a tolerance. |

2. Note: the `np.testing.assert_allclose` defaults are `rtol=1e-07, atol=0`, which float32 runtimes usually fail. That is a reason to ask for a `tolerance_spec`, not to loosen it silently.

### Output
Tolerance rule.

### Quality Gate
- The tolerance and its source (table row) are written to `parity_report`.

---

## Phase 2: Write the Tests

### Entry Criteria
- Tolerance fixed.

### Actions
1. Create `tests/test_inference_parity.py`. Do not edit model code in this flow.
2. Tests:
   - `test_golden_parity`: load via the serving path (`mlflow.pyfunc.load_model(uri).predict(inputs)` or `ort.InferenceSession(path).run(...)`), compare to `golden/expected.npy` with the Phase 1 rule.
   - `test_schema`: input columns, order and dtypes equal the signature (MLflow: `model.metadata.get_input_schema()`; ONNX: `sess.get_inputs()[0].shape` and `.type`).
   - `test_batch_invariance`: predicting rows one at a time gives the same result as one batch, under the same rule.
   - `test_edge_inputs`: the null row, unseen-category row and min/max rows from the golden set return finite outputs (`np.isfinite(out).all()`); classifier probabilities lie in [0, 1] and sum to 1 per row within the rule.
   - `test_column_order_robustness` (tabular pyfunc only): shuffled input column order either gives the same output or raises a clear schema error; it must not silently produce different numbers.
3. Load the model once per module with a `pytest` fixture (`scope="module"`).
4. Do NOT regenerate `golden/expected.npy` inside the tests; it must come from the training-time object.

### Output
`tests/test_inference_parity.py`.

### Quality Gate
- `pytest --collect-only -q tests/test_inference_parity.py` lists all applicable tests.

---

## Phase 3: Run, Mutation-Check, Wire into CI

### Entry Criteria
- Tests collected.

### Actions
1. Run `pytest -q tests/test_inference_parity.py`. Read the summary line.
2. Mutation check: copy `golden/expected.npy`, perturb one value beyond the tolerance (or flip one argmax), point the test at the copy through an environment variable, rerun; `test_golden_parity` must fail. Delete the copy after.
3. A failing parity test is a real defect. Do NOT loosen the tolerance, skip, or `xfail` it. Typical causes: preprocessing not packaged, float64 vs float32 input, pyfunc returning labels instead of probabilities, model in training mode at export.
4. Add the test to CI (for example a job step `pytest -q tests/test_inference_parity.py`) so every model or dependency change reruns it.
5. Fill `parity_report`.

### Output
`parity_report`.

### Quality Gate
- `pytest -q tests/test_inference_parity.py` shows all tests `passed` on the real files.
- The mutated golden file produced a `failed` result for `test_golden_parity`.

---

## Worked Example

Illustrative only.

Input: `sklearn_model_package` with URI `runs:/4f1c.../model`; no `tolerance_spec` (same runtime, so exact).

```
$ pytest -q tests/test_inference_parity.py
.....                                                     [100%]
5 passed in 4.02s
$ GOLDEN_EXPECTED=/tmp/expected_mutated.npy pytest -q tests/test_inference_parity.py -k golden
F                                                         [100%]
FAILED tests/test_inference_parity.py::test_golden_parity - AssertionError: Arrays are not equal
1 failed in 1.88s
```
For the ONNX package with no `tolerance_spec`: argmax agreement 1.0, observed max abs diff 2.3e-06, open question raised for `rtol`/`atol`.

---

## Exit Criteria

DONE when the parity suite passes through the real serving path with a tolerance from a named source, fails on a mutated golden file, and runs in CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Neither package present | **Stop**: run a packaging flow first. |
| Phase 2 | pyfunc returns labels | **Return**: to `mlp-sklearn-mlflow-model-package`; set `pyfunc_predict_fn="predict_proba"`. |
| Phase 3 | Golden parity fails by float32 rounding only, no `tolerance_spec` | **Adjust**: report the observed difference and ask the user for a tolerance; do not choose one. |
| Phase 3 | Batch invariance fails | **Return**: to the export flow; batch norm or dropout was active. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
