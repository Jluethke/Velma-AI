# Python and NumPy Floating Point Determinism

**One-line description:** Makes float results of Python and NumPy decision code repeatable by pinning BLAS and OpenMP thread counts, fixing summation order, recording NumPy SIMD dispatch, enabling PyTorch deterministic algorithms where used, and serializing floats exactly with `float.hex()` or `repr`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `target_platforms` (string[], optional): Machines or images that must agree bit for bit. Default: host only, recorded as such.

---

## Outputs

- `float_policy` (object): Environment variables, library versions, summation rules and serialization rule, each with the command that proves it.
- `cross_platform_diff_report` (object[]): Per machine pair: `np.show_runtime()` summary, `cmp` result, first differing value in `float.hex()` form.

---

## Phase 1: Pin Threads and Record Dispatch

### Entry Criteria
- `python -c "import numpy; print(numpy.__version__)"` prints a version.

### Actions
1. Record versions: `python -c "import sys, numpy; print(sys.version); print(numpy.__version__)"` and `pip freeze > detd_freeze.txt`.
2. Record BLAS and threading state: `python -m threadpoolctl -i numpy` (install `threadpoolctl` if missing). The output lists each BLAS or OpenMP library with `num_threads`.
3. Pin threads for the decision process at startup, before NumPy is imported: `OMP_NUM_THREADS=1`, `OPENBLAS_NUM_THREADS=1`, `MKL_NUM_THREADS=1`. Multi-threaded BLAS splits `dot` and `matmul` into blocks whose combination order can depend on thread count. For MKL builds also set `MKL_CBWR=COMPATIBLE` (MKL conditional numerical reproducibility) and record it.
4. Record SIMD dispatch: `python -c "import numpy; numpy.show_runtime()"` (NumPy 1.24 or later) prints the CPU features NumPy dispatches to. Some ufuncs (for example `np.sin`, `np.exp`) have SIMD implementations whose last bits can differ from the scalar path, so two machines with different CPU features can disagree. NumPy reads `NPY_DISABLE_CPU_FEATURES` to switch off named dispatch targets; check the NumPy "CPU build options" docs for the exact names your version accepts.
5. PyTorch on the decision path: call `torch.use_deterministic_algorithms(True)` and set `CUBLAS_WORKSPACE_CONFIG=:4096:8` for CUDA, as the PyTorch reproducibility notes describe; operations without a deterministic implementation then raise `RuntimeError` instead of silently varying.

### Output
Thread and dispatch section of `float_policy`.

### Quality Gate
- `python -m threadpoolctl -i numpy` run under the pinned environment shows `num_threads` of 1 for every listed library.
- `numpy.show_runtime()` output is saved to a file named in `float_policy`.

---

## Phase 2: Fix Summation and Serialization

### Entry Criteria
- Phase 1 complete.

### Actions
1. Find order-sensitive sums on the decision path: `rg -n 'sum\(|np\.sum|\.sum\(|np\.mean|np\.dot|@' <decision package>`.
2. Rules:

| Construct | Rule |
|---|---|
| Built-in `sum()` over values from a `set` or unsorted source | Sort the inputs first, or use `math.fsum()`, which returns the correctly rounded sum independent of order |
| `np.sum` on an array | Deterministic for the same array, layout and dtype on the same build; it uses pairwise summation, so results differ from a naive loop and can change if the array becomes non-contiguous. Keep arrays C-contiguous (`np.ascontiguousarray`) before reductions |
| Mixed float32 and float64 | Make dtype explicit (`dtype=np.float64`); implicit upcasting rules changed in NumPy 2 (NEP 50) |
| `np.dot` or `@` | Pinned BLAS threads from Phase 1; record the BLAS vendor |

3. Serialization: write floats with `float.hex(x)` for exact round trip in replay records, or `repr(x)`, which is the shortest string that round trips. Never use `f"{x:.6f}"` or `round()` in output that the replay harness compares. `json.dumps` uses `repr` for floats but emits non-standard `NaN` and `Infinity`; pass `allow_nan=False` so a NaN raises instead of writing invalid JSON, and encode NaN explicitly if the decision can produce it.
4. Edit one module at a time and run `pytest -q` after each.

### Output
Summation and serialization rules applied.

### Quality Gate
- `rg -n ':\.[0-9]+f|round\(' <decision package>/serialize*` finds nothing on compared output paths.
- `pytest -q` passed count is not lower than before.

---

## Phase 3: Cross-Machine Comparison

### Entry Criteria
- Two or more `target_platforms`, or skip to Exit noting host only.

### Actions
1. On each machine, with the same `detd_freeze.txt` installed and the pinned environment, run the decision on the same input and write output.
2. `cmp out_a out_b`. On a difference, load both files, find the first differing float, and print `float.hex()` of both.
3. Compare `show_runtime()` outputs: if SIMD features differ and the first difference follows a ufunc call, the cause is dispatch; record it.

### Output
`cross_platform_diff_report`.

### Quality Gate
- Each pair has a `cmp` exit status and, on difference, two hex floats and a cause.

---

## Worked Example

Illustrative only. Phase 1: `threadpoolctl -i numpy` shows `openblas` with `num_threads: 16` before pinning and `1` after. Phase 2: `risk = sum(w[k] for k in active_set)` changed to `math.fsum(w[k] for k in sorted(active_set))`. Phase 3: machine A (AVX512F listed) and machine B (AVX2 only) differ at `heading_cost`: `0x1.921fb54442d18p+0` versus `0x1.921fb54442d19p+0` after `np.arctan2`. Recorded as dispatch cause; policy updated to pin the dispatch target.

---

## Exit Criteria

DONE when thread counts are pinned and proven, sums and serialization follow the rules, and machine pairs compare identical or carry a classified cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `threadpoolctl` shows a library ignoring the variable | **Adjust**: set limits in code with `threadpoolctl.threadpool_limits(limits=1)` around the decision call. |
| Phase 2 | `math.fsum` changes existing expected outputs | **Return**: report the change; update expected values only after review, never silently. |
| Phase 3 | Machines differ with identical dispatch and versions | **Stop**: dump intermediates per function and compare; do not add a tolerance. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
