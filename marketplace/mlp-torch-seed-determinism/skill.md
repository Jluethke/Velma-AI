# Seeds and Deterministic Algorithms for PyTorch Training

**One-line description:** Makes PyTorch training repeatable by seeding Python, NumPy and torch, enabling `torch.use_deterministic_algorithms`, setting `CUBLAS_WORKSPACE_CONFIG`, seeding DataLoader workers per the PyTorch reproducibility notes, and proving it with a two-run state_dict comparison.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing the training code.
- `split_seed` (integer, required): The project seed from `params.yaml`.

---

## Outputs

- `torch_determinism` (object): Seed, torch/CUDA/cuDNN versions, the flags and environment variables set, any ops that raised under deterministic mode and how each was handled, and the two-run comparison result (`identical` true/false, max parameter difference, loss curves).

---

## Phase 1: Add the Seeding Function

### Entry Criteria
- Training runs from one command for a short run (a fixed small number of steps chosen by the user, for example via `--max-steps`).

### Actions
1. Create `src/repro.py` with one function and nothing else:
   ```python
   import os, random
   import numpy as np
   import torch

   def seed_everything(seed: int) -> torch.Generator:
       random.seed(seed)
       np.random.seed(seed)
       torch.manual_seed(seed)          # seeds CPU and all CUDA devices
       torch.backends.cudnn.benchmark = False
       torch.use_deterministic_algorithms(True)
       g = torch.Generator()
       g.manual_seed(seed)
       return g

   def seed_worker(worker_id: int) -> None:
       worker_seed = torch.initial_seed() % 2**32
       np.random.seed(worker_seed)
       random.seed(worker_seed)
   ```
2. Set `CUBLAS_WORKSPACE_CONFIG=:4096:8` (or `:16:8`) in the launching shell or DVC stage command BEFORE CUDA initializes. The PyTorch reproducibility notes require it for deterministic cuBLAS on CUDA 10.2 and later; without it, deterministic mode raises a `RuntimeError` naming this variable.
3. Call `g = seed_everything(seed)` as the first line of `main()`, before building the model (weight initialization consumes random numbers).
4. Every `DataLoader` gets `worker_init_fn=seed_worker, generator=g`. Without `generator`, shuffling order is drawn from the global state; without `worker_init_fn`, NumPy augmentations in workers repeat or drift.
5. If the project uses PyTorch Lightning, use `lightning.pytorch.seed_everything(seed, workers=True)` and `Trainer(deterministic=True)` instead of the hand-written function. Do not combine both.

### Output
`src/repro.py` and wired calls.

### Quality Gate
- `git grep -n "DataLoader(" -- src` lines all include `generator=` and `worker_init_fn=` (or Lightning's `workers=True` is set).
- `git grep -n "cudnn.benchmark = True" -- src` returns nothing.

---

## Phase 2: Resolve Nondeterministic Ops

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run the short training. With `use_deterministic_algorithms(True)`, an op without a deterministic implementation raises `RuntimeError: <op> does not have a deterministic implementation, but you set 'torch.use_deterministic_algorithms(True)'`.
2. For each such error, pick from this table:

| Option | When |
|---|---|
| Replace the op with a deterministic equivalent listed in the `torch.use_deterministic_algorithms` docs | An equivalent exists (for example index-based scatter replaced by a sorted or dense formulation) |
| Run that op on CPU | The op is small |
| `torch.use_deterministic_algorithms(True, warn_only=True)` | No alternative; record the op name in `torch_determinism.nondeterministic_ops` and accept non-bitwise results |

3. Do not silently drop `use_deterministic_algorithms` to make the error go away.
4. Mixed precision (`torch.autocast`) and `torch.compile` are allowed but must be identical in both comparison runs. Record whether they are on.

### Output
Short training runs without determinism errors.

### Quality Gate
- The short run exits 0 and the log contains no "does not have a deterministic implementation" error (warnings are allowed only for ops listed in `nondeterministic_ops`).

---

## Phase 3: Prove Two Runs Match

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the short training twice on the same machine and device, saving `state_dict` to `ckpt_a.pt` and `ckpt_b.pt` and the per-step loss to a CSV.
2. Compare:
   ```python
   a, b = torch.load("ckpt_a.pt"), torch.load("ckpt_b.pt")
   same = all(torch.equal(a[k], b[k]) for k in a)
   diff = max((a[k].float() - b[k].float()).abs().max().item() for k in a)
   print(same, diff)
   ```
3. Read the result:

| Result | Action |
|---|---|
| `True 0.0`, loss CSVs identical | Record and finish. |
| `False`, `warn_only` ops present | Expected; record the max difference. |
| `False`, no `warn_only` ops | Find the unseeded source: data loading order, an augmentation library with its own RNG, or a seed set after model construction. Return to Phase 1. |

4. Record that bitwise equality is only expected on the same hardware, driver, CUDA, cuDNN and torch versions; record all of them with `python -c "import torch; print(torch.__version__, torch.version.cuda, torch.backends.cudnn.version())"`.

### Output
`torch_determinism`.

### Quality Gate
- The two-run comparison output and version line are recorded verbatim.

---

## Worked Example

Illustrative only.

Input: ResNet fine-tune, `split_seed` = 7, short run of 200 steps.

```
$ CUBLAS_WORKSPACE_CONFIG=:4096:8 python src/train.py --max-steps 200 --out ckpt_a.pt
RuntimeError: adaptive_avg_pool2d_backward_cuda does not have a deterministic implementation...
```
Phase 2: no deterministic equivalent in the docs table for this model; set `warn_only=True` and list the op.

```
$ CUBLAS_WORKSPACE_CONFIG=:4096:8 python src/train.py --max-steps 200 --out ckpt_b.pt
$ python src/compare_ckpt.py
False 3.0e-07
2.4.0 12.1 90100
```
Recorded: non-bitwise due to one listed op; difference size recorded.

---

## Exit Criteria

DONE when seeding runs first, DataLoaders use a seeded generator and worker init function, deterministic algorithms are on, and the two-run comparison is recorded with versions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RuntimeError` mentioning `CUBLAS_WORKSPACE_CONFIG` | **Adjust**: set it in the shell before Python starts, then rerun. |
| Phase 2 | Many ops raise | **Adjust**: handle one op per run; rerun after each change. |
| Phase 3 | Runs differ across two GPUs of different models | **Adjust**: compare on one device; cross-hardware bitwise equality is not promised by PyTorch. |
| Phase 3 | Checkpoints identical but metrics differ | **Return**: evaluation code has its own randomness (dropout left on); confirm `model.eval()` and `torch.no_grad()`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
