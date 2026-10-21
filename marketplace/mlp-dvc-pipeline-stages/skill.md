# Define DVC Pipeline Stages with params.yaml

**One-line description:** Encodes split, featurize, train and evaluate as DVC stages in `dvc.yaml` with dependencies, `params.yaml` parameters, outputs and metrics, so `dvc repro` reruns exactly what changed and `dvc.lock` pins every input hash.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.

---

## Outputs

- `dvc_pipeline` (object): Paths of `dvc.yaml`, `params.yaml`, `dvc.lock`; stage names; the output of `dvc dag`; and the result of a no-op `dvc repro` proving the pipeline is up to date.

---

## Phase 1: Write params.yaml and the Stages

### Entry Criteria
- `dvc status` is clean for raw data.
- Each stage already exists as a script that reads its parameters from `params.yaml` (for example with `yaml.safe_load`) or through `dvc.api.params_show()`.

### Actions
1. Put every tunable value in `params.yaml` under one key per stage, for example `split.seed`, `split.test_fraction`, `features` (list), `train.model`, `train.max_iter`. Do not leave the same constant in code.
2. Add stages with `dvc stage add`, one command per stage. Example for split:
   `dvc stage add -n split -d src/split.py -d data/raw/orders.parquet -p split.seed,split.test_fraction -o data/splits/split.parquet python src/split.py`
3. Train stage: `dvc stage add -n train -d src/train.py -d data/splits/split.parquet -d data/raw/orders.parquet -p features,train -o models/model.joblib python src/train.py`
4. Evaluate stage with metrics and plots: `dvc stage add -n evaluate -d src/evaluate.py -d models/model.joblib -d data/splits/split.parquet -M metrics/val.json --plots-no-cache plots/pr_curve.csv python src/evaluate.py`. `-M` marks a metrics file that is committed to git (not cached). Check `dvc stage add --help` for the exact plots flags in your version.
5. If `split.parquet` was already tracked with `dvc add`, run `dvc remove data/splits/split.parquet.dvc` before declaring it as a stage output; DVC refuses an output owned by two places.
6. Every file a script reads must be a `-d`. A missing dependency means `dvc repro` silently skips a stage that should rerun.

### Output
`dvc.yaml` and `params.yaml`.

### Quality Gate
- `dvc dag` prints a graph with `split -> train -> evaluate` (and any featurize stage) and no unconnected stage.
- `git grep -n "random_state=[0-9]" -- src` returns nothing; seeds come from `params.yaml`.

---

## Phase 2: Reproduce and Lock

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run `dvc repro`. Read the log: each stage prints `Running stage '<name>'` or `Stage '<name>' didn't change, skipping`.
2. Commit `dvc.yaml`, `dvc.lock`, `params.yaml`, `metrics/val.json` together: `git add dvc.yaml dvc.lock params.yaml metrics/ && git commit -m "Add DVC pipeline"`.
3. Run `dvc repro` again. Every stage must print `didn't change, skipping`. If any stage reruns, an output is not deterministic or a dependency is written during the run; investigate before continuing.
4. Change one parameter as a test: `dvc exp run --set-param train.max_iter=<other value>`; then `dvc exp show` lists the experiment with its params and metrics; `dvc params diff` and `dvc metrics diff` compare to the workspace. Discard the test with `dvc exp remove <name>` if it is not wanted.
5. `dvc push` so the outputs in the cache reach the remote.

### Output
`dvc_pipeline`.

### Quality Gate
- The second `dvc repro` reports every stage as unchanged.
- `dvc status` prints that data and pipelines are up to date.
- `dvc.lock` contains an `md5` for every `deps` and `outs` entry.

---

## Worked Example

Illustrative only.

```
$ dvc dag
+-------+
| split |
+-------+
    *
+-------+
| train |
+-------+
    *
+----------+
| evaluate |
+----------+
$ dvc repro
Running stage 'split': > python src/split.py
Running stage 'train': > python src/train.py
Running stage 'evaluate': > python src/evaluate.py
$ dvc repro
Stage 'split' didn't change, skipping
Stage 'train' didn't change, skipping
Stage 'evaluate' didn't change, skipping
Data and pipelines are up to date.
$ dvc exp run --set-param train.max_iter=500
$ dvc metrics diff
Path             Metric   HEAD     workspace  Change
metrics/val.json avg_prec 0.3124   0.3141     0.0017
```

---

## Exit Criteria

DONE when `dvc repro` rebuilds from raw data to metrics, a second run is a no-op, and `dvc.lock` is committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "output ... is already specified in stage" or "already tracked" | **Adjust**: remove the duplicate `.dvc` file or stage output, keep one owner. |
| Phase 2 | Second `dvc repro` reruns a stage | **Adjust**: find the nondeterministic output (unseeded code, timestamps written into the file) and fix it. |
| Phase 2 | Stage fails | **Stop**: read the script's traceback; do not mark the stage `frozen` to skip it. |
| Phase 2 | `dvc push` fails | **Retry**: once after checking credentials; then report the error. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
