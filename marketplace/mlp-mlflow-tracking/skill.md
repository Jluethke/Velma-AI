# Track Experiments with MLflow

**One-line description:** Sets up MLflow tracking with a SQLite or server backend and logs, for every training run, the git commit, DVC data hashes, seed and determinism record, params, per-fold and final metrics, and artifacts, so any number in a report traces to one run ID.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `tracking_uri` (string, required): For example `sqlite:///mlflow.db` (local) or `http://mlflow.internal:5000` (shared server).
- `experiment_name` (string, required): For example `refund-risk`.
- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `sklearn_determinism` (object, optional): From `mlp-sklearn-seed-determinism`.
- `torch_determinism` (object, optional): From `mlp-torch-seed-determinism`.

---

## Outputs

- `mlflow_run_ref` (object): `tracking_uri`, `experiment_id`, the run ID of a verified reference run, the list of params, metrics, tags and artifacts that every run must carry, and the path of `src/tracking.py`.

---

## Phase 1: Configure the Backend

### Entry Criteria
- `python -c "import mlflow; print(mlflow.__version__)"` prints a version. Record it; the model-logging argument names differ between MLflow 2 and 3.

### Actions
1. Choose the backend:

| Situation | `tracking_uri` |
|---|---|
| One person, one machine | `sqlite:///mlflow.db` (do not use the plain `./mlruns` file store for new projects; recent MLflow versions steer toward a database backend) |
| Team | A tracking server: `mlflow server --backend-store-uri postgresql://... --artifacts-destination s3://bucket/mlflow --host 0.0.0.0 --port 5000` (check `mlflow server --help` for your version's flags) |

2. Set it in ONE place: export `MLFLOW_TRACKING_URI` in the DVC stage or `.env`, or call `mlflow.set_tracking_uri(...)` in `src/tracking.py`. Not both.
3. Add `mlflow.db` and `mlruns/` to `.gitignore`.

### Output
Working backend.

### Quality Gate
- `python -c "import mlflow; mlflow.set_tracking_uri('<uri>'); print(mlflow.get_tracking_uri())"` prints the chosen URI.

---

## Phase 2: Write the Logging Helper

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `src/tracking.py` with a context manager used by every training script:
   ```python
   import mlflow, json, subprocess

   def start(run_name, params, data_version, determinism):
       mlflow.set_experiment(EXPERIMENT_NAME)
       run = mlflow.start_run(run_name=run_name)
       mlflow.log_params(params)
       mlflow.set_tags({
           "dvc.md5." + k: v["md5"] for k, v in data_version.items()
       })
       mlflow.set_tag("git.dirty", str(bool(subprocess.run(
           ["git", "status", "--porcelain"], capture_output=True, text=True).stdout)))
       mlflow.log_dict(determinism, "determinism.json")
       mlflow.log_artifact("dvc.lock")
       mlflow.log_artifact("params.yaml")
       return run
   ```
2. MLflow records the git commit automatically as tag `mlflow.source.git.commit` when the script runs inside a git repo with GitPython installed. Check for it in Phase 3 rather than assuming.
3. Log per-fold scores with a step: `mlflow.log_metric("cv_" + metric_name, score, step=fold)`; log the summary as `cv_mean_<metric>` and `val_<metric>`. Use the same metric names in every run so runs compare.
4. Param values are stored as strings and a param key cannot be logged twice with a different value in one run (MLflow raises an error). Log changing values as metrics, not params.
5. Autologging is optional: `mlflow.sklearn.autolog(log_models=False)` logs estimator params and training metrics; keep explicit logging for project metrics because autolog's training-set metrics are not CV scores.
6. Never log raw data rows or secrets as artifacts.

### Output
`src/tracking.py` used by training.

### Quality Gate
- `git grep -n "mlflow.start_run" -- src` shows exactly one location (`src/tracking.py`).

---

## Phase 3: Verify a Reference Run

### Entry Criteria
- Training calls the helper.

### Actions
1. Run training once.
2. Read the run back:
   ```python
   from mlflow.tracking import MlflowClient
   r = MlflowClient().get_run(run_id)
   print(r.data.params.keys(), r.data.metrics.keys(), r.data.tags.get("mlflow.source.git.commit"))
   print([a.path for a in MlflowClient().list_artifacts(run_id)])
   ```
3. Confirm: git commit tag present, `git.dirty` is `False`, every `dvc.md5.*` tag matches `data_version`, `determinism.json`, `dvc.lock`, `params.yaml` in artifacts.
4. Open the UI to read it: `mlflow ui --backend-store-uri <tracking_uri>` and browse to the printed address.
5. Fill `mlflow_run_ref` with the run ID and the required lists.

### Output
`mlflow_run_ref`.

### Quality Gate
- The `get_run` output shows a non-empty `mlflow.source.git.commit`, `git.dirty` = `False`, and the three artifacts.

---

## Worked Example

Illustrative only.

```
$ export MLFLOW_TRACKING_URI=sqlite:///mlflow.db
$ python src/train.py --run-name logreg_ref
$ python src/check_run.py 4f1c2a9e8b7d4c6a
params: ['C', 'class_weight', 'features_hash', 'seed']
metrics: ['cv_average_precision', 'cv_mean_average_precision', 'val_average_precision']
git commit: a1b2c3d4e5   git.dirty: False
artifacts: ['determinism.json', 'dvc.lock', 'params.yaml']
```

---

## Exit Criteria

DONE when one helper starts every run, and a reference run shows the git commit, clean tree, DVC hashes, seed record and project metrics.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `MlflowException` about changing a param value | **Adjust**: log that value as a metric or tag. |
| Phase 3 | Git commit tag missing | **Adjust**: install GitPython or set the tag yourself from `git rev-parse HEAD`. |
| Phase 3 | `git.dirty` is `True` | **Retry**: commit the code, then rerun; a dirty run cannot be reproduced from its commit. |
| Phase 3 | Server unreachable | **Stop**: do not fall back to a local store silently; runs would split across two backends. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
