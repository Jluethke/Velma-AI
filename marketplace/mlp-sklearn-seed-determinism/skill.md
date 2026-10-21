# Seeds and Determinism for scikit-learn Training

**One-line description:** Makes a scikit-learn (and NumPy, LightGBM or XGBoost when present) training run bit-for-bit repeatable by threading one seed through every random component, controlling thread-level nondeterminism, and proving it with a two-run prediction comparison.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing the training code.
- `split_seed` (integer, required): The project seed, stored in `params.yaml`.

---

## Outputs

- `sklearn_determinism` (object): The seed, every location that receives it, library versions (`sklearn`, `numpy`, `scipy`, `threadpoolctl` info), the environment variables set, and the result of the two-run comparison (`identical` true/false and max absolute prediction difference).

---

## Phase 1: Find Every Source of Randomness

### Entry Criteria
- Training runs end to end from one command (for example `python src/train.py` or `dvc repro train`).

### Actions
1. Search: `git grep -n -E "random_state|np\.random|default_rng|shuffle|random\.|sample\(|seed" -- src`.
2. List every estimator and splitter constructed in `src`: `git grep -n -E "(Classifier|Regressor|KFold|Split|Search|Sampler)\(" -- src`.
3. For each one, record whether it accepts `random_state` (check `help(Estimator)` or the scikit-learn API page; do not assume). Estimators that use randomness include tree ensembles, `SGD*`, `MLP*`, `LogisticRegression` with `solver="sag"`/`"saga"`/`"liblinear"`, `KMeans`, splitters with `shuffle=True`, `RandomizedSearchCV`, `HistGradientBoosting*` when early stopping or subsampling.
4. Find global-state calls: `np.random.seed`, `np.random.rand`, Python `random.*`. These are fragile because any library call can advance the global state.

### Output
A table of randomness sources with file and line.

### Quality Gate
- Every estimator and splitter found in step 2 appears in the table with `accepts random_state: yes/no`.

---

## Phase 2: Thread One Seed Through Everything

### Entry Criteria
- Phase 1 table complete.

### Actions
1. Read the seed once: `seed = params["split"]["seed"]` from `params.yaml`.
2. Create one generator: `rng = np.random.default_rng(seed)`. Pass `rng` (or integers drawn from it) to code that needs randomness. Replace `np.random.seed(...)`/`np.random.rand` with `rng.random(...)`.
3. Pass `random_state=seed` (an int, not a `RandomState` instance) to every estimator and splitter that accepts it. An int gives the same result each `fit`; a shared `RandomState` instance changes between fits and across CV folds.
4. Third-party boosters: LightGBM uses `random_state` in its scikit-learn API and has `deterministic=True` (check the LightGBM parameters page; it also requires `force_row_wise=True` or `force_col_wise=True` per its docs). XGBoost uses `random_state` and its histogram method is deterministic on CPU per its docs; on GPU, check the XGBoost docs for your version.
5. `PYTHONHASHSEED` affects iteration order of `set` and string hashing. It must be set BEFORE the interpreter starts: in the DVC stage command or shell (`PYTHONHASHSEED=0 python src/train.py`), not with `os.environ` inside the script. Any code iterating a `set` of feature names should iterate `sorted(...)` instead.
6. Thread-level float differences: BLAS and OpenMP reductions can change summation order with thread count. Record the thread info with `python -c "import threadpoolctl, pprint; pprint.pprint(threadpoolctl.threadpool_info())"`. If Phase 3 shows non-identical output, pin threads with `OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1` for the comparison run, then decide with the table in Phase 3.
7. Edit one file at a time and rerun training after each file. Do not batch edits across many files before running.

### Output
Seeded code and recorded environment.

### Quality Gate
- `git grep -n -E "np\.random\.(seed|rand|randn|choice|shuffle)\(" -- src` returns nothing.
- Every row of the Phase 1 table that accepts `random_state` now passes the seed.

---

## Phase 3: Prove Two Runs Match

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run training twice into two output paths (for example `MODEL_OUT=models/run_a.joblib` and `models/run_b.joblib`).
2. Load both and predict on the validation rows: `pa = a.predict_proba(X_val)`, `pb = b.predict_proba(X_val)` (use `predict` for regressors).
3. Compare: `print(np.array_equal(pa, pb), np.max(np.abs(pa - pb)))`.
4. Read the result with this table:

| Result | Meaning | Action |
|---|---|---|
| `True 0.0` | Deterministic | Record and finish. |
| `False`, difference near machine epsilon, identical with threads pinned to 1 | Thread-order float differences | Record as known; pin threads in the training stage if bitwise repeatability is required by the user. |
| `False`, larger difference, also with threads pinned | A random source is unseeded | Return to Phase 1 step 1. |

5. Also compare CV scores from both runs; they must match to the printed digits.

### Output
`sklearn_determinism`.

### Quality Gate
- The two-run comparison output is recorded verbatim.
- The result row from the table is named.

---

## Worked Example

Illustrative only.

Input: `split_seed` = 20240611; code uses `RandomForestClassifier(n_estimators=300)` and `StratifiedKFold(5, shuffle=True)` with no seeds, and `np.random.choice` for negative downsampling.

- Phase 1: three sources found; none seeded.
- Phase 2: `RandomForestClassifier(n_estimators=300, random_state=seed, n_jobs=-1)`, `StratifiedKFold(5, shuffle=True, random_state=seed)`, `rng.choice(...)` replaces `np.random.choice`.
- Phase 3:

```
$ python src/compare_runs.py models/run_a.joblib models/run_b.joblib
True 0.0
cv scores a: [0.3121 0.3088 0.3172 0.3040 0.3115]
cv scores b: [0.3121 0.3088 0.3172 0.3040 0.3115]
```

---

## Exit Criteria

DONE when every random component takes the project seed, global NumPy random calls are gone, and two runs produce identical predictions (or the residual difference is explained by thread count and recorded).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Estimator's docs do not list `random_state` | **Adjust**: record "not random" after confirming with `help()`; do not pass an invented argument. |
| Phase 2 | `TypeError: __init__() got an unexpected keyword argument 'random_state'` | **Adjust**: remove it; that estimator is deterministic or seeded differently per its docs. |
| Phase 3 | Runs differ even single-threaded | **Return**: to Phase 1; search third-party code paths and data loading order. |
| Phase 3 | Data load order differs between runs | **Adjust**: sort by `row_id` after loading. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
