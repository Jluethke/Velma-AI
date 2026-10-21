# Track Experiments with Weights & Biases

**One-line description:** Logs every training run to Weights & Biases with its config, seed and determinism record, DVC data hashes as a dataset artifact reference, per-step and per-fold metrics, and the git state, so any reported number traces to one run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `wandb_project` (string, required): Project name, optionally with entity (`team/refund-risk`).
- `data_version` (object, required): From `mlp-dvc-version-raw-data`.
- `sklearn_determinism` (object, optional): From `mlp-sklearn-seed-determinism`.
- `torch_determinism` (object, optional): From `mlp-torch-seed-determinism`.

---

## Outputs

- `wandb_run_ref` (object): Entity, project, run ID and URL of a verified reference run, the dataset artifact name and version, the required config keys and metric names, and the path of `src/tracking_wandb.py`.

---

## Phase 1: Authenticate and Choose the Mode

### Entry Criteria
- `python -c "import wandb; print(wandb.__version__)"` prints a version.

### Actions
1. Log in with `wandb login` (stores the key in `~/.netrc`) or set `WANDB_API_KEY` from a secret store. Never write the key into code, `params.yaml` or the repo.
2. Choose the mode:

| Situation | Setting |
|---|---|
| Machine has network access | default (`mode="online"`) |
| Air-gapped or CI without credentials | `WANDB_MODE=offline`, then later `wandb sync wandb/offline-run-*` from a machine with access |
| Unit tests | `WANDB_MODE=disabled` so tests never create runs |

3. Add `wandb/` (the local run directory) to `.gitignore`.

### Output
Authenticated environment.

### Quality Gate
- `git grep -n -i "wandb_api_key\s*=" -- .` returns nothing.

---

## Phase 2: Write the Logging Helper

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `src/tracking_wandb.py`:
   ```python
   import wandb

   def start(run_name, config, data_version, determinism, job_type="train"):
       run = wandb.init(project=PROJECT, name=run_name, job_type=job_type,
                        config={**config, "determinism": determinism})
       ds = wandb.Artifact("raw-data", type="dataset",
                           metadata={k: v["md5"] for k, v in data_version.items()})
       ds.add_file("dvc.lock")
       run.use_artifact(ds)   # records lineage: this run consumed this data version
       return run
   ```
   Check the `wandb.Artifact` docs for `add_reference` if you prefer pointing at the DVC remote URL instead of attaching `dvc.lock`.
2. Log metrics with an explicit step so curves align: `run.log({"train/loss": loss, "val/loss": vloss}, step=global_step)`. Steps must increase; logging a smaller step than a previous one is dropped with a warning.
3. Log per-fold CV scores as `run.log({"cv/fold": i, "cv/average_precision": s})` and the summaries as `run.summary["cv_mean_average_precision"] = m` and `run.summary["val_average_precision"] = v`.
4. W&B records the git commit and remote in run metadata when run inside a git repo; check the run's Overview page in Phase 3.
5. End every run with `run.finish()` (or use `with wandb.init(...) as run:`), including on exceptions, so runs do not stay "running".
6. `config` is for inputs (hyperparameters, seed); `summary` is for final outputs. Do not put metrics in `config`.

### Output
`src/tracking_wandb.py` used by training.

### Quality Gate
- `git grep -n "wandb.init" -- src` shows exactly one location.

---

## Phase 3: Verify a Reference Run

### Entry Criteria
- Training calls the helper.

### Actions
1. Run training once and copy the run URL from the console line `View run at https://wandb.ai/...`.
2. Read it back with the public API:
   ```python
   api = wandb.Api()
   r = api.run("<entity>/<project>/<run_id>")
   print(r.config.get("seed"), dict(r.summary).keys(), r.commit)
   print([a.name for a in r.used_artifacts()])
   ```
3. Confirm: seed present in config, project summary metrics present, commit present, `raw-data:vN` in used artifacts.
4. Fill `wandb_run_ref`.

### Output
`wandb_run_ref`.

### Quality Gate
- The API printout shows the seed, both summary metrics, a commit hash and the dataset artifact.

---

## Worked Example

Illustrative only.

```
$ python src/train.py --run-name resnet_ref
wandb: Tracking run with wandb version 0.17.x
wandb: View run at https://wandb.ai/acme/xray-triage/runs/3kq9z1ab
$ python src/check_wandb_run.py acme/xray-triage/3kq9z1ab
7 dict_keys(['cv_mean_average_precision', 'val_average_precision', 'train/loss', '_step']) 9f8e7d6c
['raw-data:v3']
```

---

## Exit Criteria

DONE when one helper starts every run, runs end cleanly, and a reference run shows seed, metrics, commit and the dataset artifact.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `wandb.errors.UsageError: api_key not configured` | **Adjust**: run `wandb login` or use `WANDB_MODE=offline`. |
| Phase 2 | Metrics missing because step went backward | **Adjust**: use one monotonically increasing `global_step`. |
| Phase 3 | `r.commit` is empty | **Adjust**: run from inside the git repo, or log `git rev-parse HEAD` into `config`. |
| Phase 3 | Runs stuck as "running" | **Adjust**: wrap training in `with wandb.init(...)`; mark old runs crashed in the UI. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
