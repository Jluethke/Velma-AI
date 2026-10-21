# Hyperparameter Search with Optuna

**One-line description:** Runs a seeded, resumable Optuna study (TPE sampler, SQLite storage, pruning for iterative models) whose objective scores only the saved CV folds, logs every trial to the project tracker, and refits the best configuration into `tuned_model` without touching test data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feature_pipeline` (object, required): From `mlp-sklearn-feature-pipeline`.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `baseline_scores` (object[], required): From `mlp-baseline-models`; the bar to beat.
- `search_space` (object, required): Parameter names, types, ranges and log scale, chosen by the user from the model's documentation.
- `n_trials` (integer, required): Trial count, a user input (compute cost decides it).
- `stack` (string, required): `sklearn` or `pytorch`; selects the objective template.
- `tracker` (string, required): `mlflow` or `wandb`.
- `mlflow_run_ref` (object, optional): From `mlp-mlflow-tracking`.
- `wandb_run_ref` (object, optional): From `mlp-wandb-tracking`.

---

## Outputs

- `best_params` (object): Best trial's parameters, value, trial number, and the CV std of that trial.
- `optuna_study_ref` (object): Storage URL, study name, sampler and seed, trial counts by state (complete, pruned, fail).
- `tuned_model` (object): Path of the model refit on train (and validation, per the rule below) with `best_params`, and its validation score.

---

## Phase 1: Write the Objective

### Entry Criteria
- `search_space` lists each parameter with a range from the estimator's docs.
- `python -c "import optuna; print(optuna.__version__)"` prints a version.

### Actions
1. Create `src/tune.py`. Map `search_space` to suggest calls, one per parameter:
   - continuous, multiplicative scale (learning rate, regularization): `trial.suggest_float("C", low, high, log=True)`
   - integer: `trial.suggest_int("max_depth", low, high)`
   - choice: `trial.suggest_categorical("penalty", ["l1", "l2"])`
   Do not use the removed `suggest_uniform` / `suggest_loguniform` names.
2. Objective by `stack`:

| `stack` | Objective body |
|---|---|
| `sklearn` | Build `build_pipeline(Estimator(**params))`, return the mean of `cross_validate(pipe, X_train, y_train, cv=project_cv(split_manifest), scoring=primary_metric.scoring)["test_score"]`. Store the std with `trial.set_user_attr("cv_std", std)`. |
| `pytorch` | Train on train rows, evaluate on validation each epoch, call `trial.report(val_score, epoch)`, then `if trial.should_prune(): raise optuna.TrialPruned()`. Return the final validation score. |

3. Only train and validation data are loaded in `src/tune.py`. Do NOT load test rows; add `assert "test" not in set(split_used)` as a guard.
4. Conditional spaces: suggest a parameter only inside the branch where it applies (for example `l1_ratio` only when `penalty == "elasticnet"`).

### Output
`src/tune.py` with an objective.

### Quality Gate
- Running the objective once with `optuna.trial.FixedTrial(<one valid param dict>)` returns a float equal to the CV mean of the same configuration computed directly.
- `git grep -n "test" -- src/tune.py` shows only the guard line.

---

## Phase 2: Run the Study

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create a resumable, seeded study:
   ```python
   study = optuna.create_study(
       study_name="refund-logreg-v1",
       storage="sqlite:///optuna.db",
       direction="maximize",     # "minimize" only if the objective returns a loss, not a neg_* score
       sampler=optuna.samplers.TPESampler(seed=seed),
       pruner=optuna.pruners.MedianPruner(),
       load_if_exists=True,
   )
   study.optimize(objective, n_trials=n_trials, n_jobs=1)
   ```
2. Direction rule: scikit-learn scorers are "greater is better" (losses are returned negated as `neg_*`), so `direction="maximize"` for every scikit-learn scoring string.
3. TPE samples randomly for its first `n_startup_trials` (default 10 per the Optuna docs) before modeling; `n_trials` below that is effectively random search. Record this.
4. Sampler seeding only reproduces the same trials with `n_jobs=1` and sequential execution; parallel runs are not reproducible. Record which was used.
5. Log trials to the tracker: for `mlflow`, wrap each trial in `mlflow.start_run(nested=True)` inside a parent run, or use `optuna_integration.MLflowCallback` (package `optuna-integration`; check its docs). For `wandb`, use `optuna_integration.WeightsAndBiasesCallback` or log `trial.params` and the value per trial.
6. Watch the study: `optuna-dashboard sqlite:///optuna.db` (separate package `optuna-dashboard`).

### Output
Completed study in `optuna.db`.

### Quality Gate
- `python -c "import optuna; s=optuna.load_study(study_name='<name>', storage='sqlite:///optuna.db'); print(len(s.trials), s.best_value, s.best_params)"` prints `n_trials` (or more if resumed) and a best value.
- Trial states are counted; failed trials are zero or each has a recorded exception.

---

## Phase 3: Check and Refit

### Entry Criteria
- Study complete.

### Actions
1. Compare `study.best_value` with the best baseline CV mean from `baseline_scores`. If it does not exceed it by more than the best trial's `cv_std`, record "tuning gave no detectable gain" and keep the simpler model as `tuned_model`.
2. Check for edge-of-range optima: if any best parameter sits at a boundary of `search_space`, record an open question to widen that range (user decision).
3. Refit rule:

| Split strategy | Refit data |
|---|---|
| `random`, `group` | train + validation rows |
| `time` | train + validation rows, preserving time order; test stays after both |

   Score the refit configuration on validation BEFORE adding validation to the fit (fit on train only, score val) and record that score; then refit on train + val and save `models/tuned.joblib` (or `models/tuned.pt` with its config).
4. Log `best_params`, the study name and the tuned model path to the tracker.

### Output
`best_params`, `optuna_study_ref`, `tuned_model`.

### Quality Gate
- `tuned_model` path exists and loads (`joblib.load` or `torch.load`).
- The validation score of the best configuration is recorded next to the baseline bar.

---

## Worked Example

Illustrative only.

Input: `stack` = `sklearn`, `HistGradientBoostingClassifier`, `search_space` = learning_rate [0.01, 0.3] log, max_leaf_nodes [15, 255], l2_regularization [1e-6, 10] log, `n_trials` = 60, seed 20240611.

```
$ python src/tune.py
[I] Trial 59 finished with value: 0.3542 and parameters: {...}
$ python -c "import optuna; s=optuna.load_study(study_name='refund-hgb-v1', storage='sqlite:///optuna.db'); print(len(s.trials), round(s.best_value,4), s.best_params)"
60 0.3561 {'learning_rate': 0.047, 'max_leaf_nodes': 63, 'l2_regularization': 0.31}
baseline bar (logreg cv mean): 0.2987   best trial cv_std: 0.0094
val score (fit on train): 0.3688  -> refit on train+val saved to models/tuned.joblib
```

---

## Exit Criteria

DONE when the study is stored and resumable, the best configuration beats the baseline by more than its CV spread or the simpler model is kept, and `tuned_model` is refit without test data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `FixedTrial` value differs from direct CV | **Stop**: objective uses different folds or data; fix before searching. |
| Phase 2 | Many trials `FAIL` | **Adjust**: read `trial.system_attrs` / logs for the exception; narrow the space that causes invalid combinations. |
| Phase 2 | Study name exists with a different space | **Adjust**: create a new study name; do not mix spaces in one study. |
| Phase 3 | Best value below baseline | **Return**: keep the baseline as `tuned_model` and record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
