# Package a scikit-learn Model as an MLflow Model

**One-line description:** Saves the final scikit-learn pipeline (preprocessing plus model, calibrated if applicable) as an MLflow Model with an inferred signature, input example, pinned requirements and `predict_proba` as the pyfunc method, and writes a golden prediction file from the in-memory object for parity tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sklearn_calibrated_model` (object, required): From `mlp-sklearn-calibrate-probabilities`; the calibrated model or the uncalibrated one with reason "skip".
- `tuned_model` (object, required): From `mlp-optuna-search`; used for provenance.
- `split_manifest` (object, required): From `mlp-split-integrity-check`; the golden rows come from test.

---

## Outputs

- `sklearn_model_package` (object): The model URI (`runs:/<run_id>/model` or a local path), the `MLmodel` file contents, the signature, `requirements.txt` contents, the registered model name and version if registered, and the path of `golden/inputs.parquet` and `golden/expected.npy`.

---

## Phase 1: Build the Signature and Golden Set

### Entry Criteria
- `python -c "import mlflow; print(mlflow.__version__)"` prints a version; note whether it is 2.x or 3.x.

### Actions
1. Load the final model object. It must be the FULL pipeline that takes raw feature columns. Packaging only the estimator without preprocessing is the most common cause of serving skew.
2. Golden set: take a seeded sample of test rows (sample size a user input) as RAW feature columns in the training column order. Add hand-made edge rows: one with every nullable column null, one with an unseen category, one at each numeric column's observed min and max.
3. Compute expected output from the in-memory object: `expected = model.predict_proba(golden_X)`. Save `golden/inputs.parquet` and `np.save("golden/expected.npy", expected)`.
4. Signature: `from mlflow.models import infer_signature; sig = infer_signature(golden_X, expected)`. MLflow's signature does not accept every DataFrame type; if passing the polars frame fails, convert with `golden_X.to_numpy()` only when the model accepts arrays, or use a dict of column arrays. Check the MLflow signature docs for supported input types in your version.

### Output
Signature and golden files.

### Quality Gate
- `golden/inputs.parquet` and `golden/expected.npy` exist and have the same row count.
- The signature lists every column in `clean_feature_list` with a type.

---

## Phase 2: Log the Model

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Log inside the training run (or a packaging run tagged with the training run ID):
   ```python
   import mlflow.sklearn
   info = mlflow.sklearn.log_model(
       model,
       name="model",                     # MLflow 3; MLflow 2 uses artifact_path="model"
       signature=sig,
       input_example=golden_X_head,
       pyfunc_predict_fn="predict_proba",
       registered_model_name=None,       # set a name to register
   )
   print(info.model_uri)
   ```
2. `pyfunc_predict_fn="predict_proba"` makes `mlflow.pyfunc.load_model(...).predict(...)` return probabilities. Without it, pyfunc returns `predict` labels, and the serving output silently differs from what was evaluated.
3. Requirements: MLflow infers `requirements.txt`. Open it and confirm scikit-learn, numpy and scipy are pinned to the versions in the training environment (`pip freeze | grep -E "scikit-learn|numpy|scipy"`). Pass `pip_requirements=[...]` or `extra_pip_requirements=[...]` if anything is missing (for example `polars`, or a package that defines a custom transformer).
4. Custom transformers (`FunctionTransformer` with a project function) must be importable at load time: pass `code_paths=["src/"]` (MLflow 2.x name; check the docs for your version).
5. To register: `mlflow.register_model(info.model_uri, "<name>")` or set `registered_model_name`. Use aliases (`client.set_registered_model_alias(name, "champion", version)`) rather than the deprecated stages.

### Output
Logged model.

### Quality Gate
- The run's artifact listing shows `model/MLmodel`, `model/requirements.txt`, `model/model.pkl` (or the configured serialization), `model/input_example.json`.
- `MLmodel` contains `predict_fn: predict_proba` under the `python_function` flavor.

---

## Phase 3: Load-Back Check

### Entry Criteria
- Model logged.

### Actions
1. In a FRESH virtual environment built from `model/requirements.txt` (`python -m venv /tmp/pkgcheck && /tmp/pkgcheck/bin/pip install -r requirements.txt mlflow`), load and predict:
   ```python
   m = mlflow.pyfunc.load_model(model_uri)
   out = m.predict(golden_inputs)
   np.testing.assert_array_equal(np.asarray(out), np.load("golden/expected.npy"))
   ```
   Same library versions and same serialized object should give bitwise-equal output; any difference means the environment or the input conversion differs.
2. Optional CLI check: `mlflow models predict -m <model_uri> -i golden/input.json -t json --env-manager local` (check `mlflow models predict --help` for the flags in your version).
3. Record everything in `sklearn_model_package`.

### Output
`sklearn_model_package`.

### Quality Gate
- `assert_array_equal` passes in the fresh environment.

---

## Worked Example

Illustrative only.

```
$ python src/package.py
model_uri: runs:/4f1c2a9e8b7d4c6a/model
$ cat mlruns/.../model/MLmodel | grep -A3 python_function
  python_function:
    env: {conda: conda.yaml, virtualenv: python_env.yaml}
    loader_module: mlflow.sklearn
    predict_fn: predict_proba
$ /tmp/pkgcheck/bin/python src/load_back.py runs:/4f1c2a9e8b7d4c6a/model
golden rows: 503 (500 sampled + 3 edge rows)   max abs diff: 0.0   PASS
```

---

## Exit Criteria

DONE when the full pipeline is logged with signature, input example, pinned requirements and `predict_proba` as the pyfunc method, and a fresh environment reproduces the golden output exactly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only the bare estimator is available | **Stop**: rebuild the full pipeline object; do not package preprocessing separately by hand. |
| Phase 2 | `TypeError` on `name=` | **Adjust**: MLflow 2.x; use `artifact_path="model"`. |
| Phase 3 | `ModuleNotFoundError` for project code at load | **Adjust**: add `code_paths`. |
| Phase 3 | Output differs in the fresh environment | **Adjust**: compare `pip freeze` between environments and pin the differing package. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
