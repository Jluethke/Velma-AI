# Parity Reduction Order Alignment

**One-line description:** Finds every sum, dot product, and other reduction where the reference and the port add in a different order (NumPy pairwise summation, BLAS blocking and threading, `std::reduce`, OpenMP reductions, SIMD loops) and fixes both sides to one written order.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_repo` (string, required): Path to the Python reference.
- `port_repo` (string, required): Path to the C++ port.
- `parity_contract` (object, required): Output of `parity-contract-scope`.

---

## Outputs

- `reduction_findings` (object[]): Each reduction site on both sides with its order as implemented, the agreed order, and whether the two sides now match.

---

## Phase 1: Find Reductions

### Entry Criteria
- Both repos are readable.

### Actions
1. Reference sweep: `grep -rnE "\b(sum|np\.sum|numpy\.sum|\.sum\(|np\.dot|\.dot\(|@|np\.matmul|np\.mean|\.mean\(|np\.linalg\.norm|np\.einsum|math\.fsum|np\.add\.reduce|np\.cumsum|np\.prod)" <reference_repo>`.
2. Port sweep: `grep -rnE "std::(accumulate|reduce|transform_reduce|inner_product)|#pragma omp .*reduction|\.sum\(\)|\.dot\(|\.norm\(|cblas_|for *\(.*\+=)" <port_repo>`. The last pattern over-matches; read each hit.
3. Record the order each site uses, from these documented facts:

| Construct | Order |
|---|---|
| Python built-in `sum(list)` | left to right, sequential |
| `math.fsum` | exactly rounded sum (order independent) |
| `np.sum` / `np.add.reduce` on contiguous float arrays | pairwise summation (NumPy documentation for `numpy.sum`, Notes) |
| `np.cumsum` | sequential left to right |
| `np.dot`, `@`, `np.matmul` | delegated to BLAS; order depends on the BLAS library, its kernel, and thread count |
| `std::accumulate` | left to right, sequential (C++ standard) |
| `std::reduce`, `std::transform_reduce` | unspecified order (C++ standard allows any grouping) |
| `#pragma omp ... reduction(+:x)` | unspecified order, varies with thread count |
| Eigen `.sum()`, `.dot()` | vectorized, order depends on SIMD width |

### Output
Reduction site list with the order each implements.

### Quality Gate
- Every hit from both sweeps is either in the list or marked "not a reduction" with a reason.

---

## Phase 2: Agree on One Order

### Entry Criteria
- Site list complete.

### Actions
1. For each pair of matching sites, pick the order with this rule:

| Situation | Agreed order |
|---|---|
| Port uses a sequential loop or `std::accumulate` | change the reference to sequential: `np.cumsum(a)[-1]` for a nonempty array, or an explicit Python loop |
| Port must stay parallel or vectorized for speed | write an explicit blocked order (fixed block size as a named constant from the port) in both, and make the port independent of thread count |
| Accuracy matters more than speed | use an exactly rounded or compensated sum in both (`math.fsum` in Python; a Neumaier sum in C++ compiled without `-fassociative-math`) |

2. For BLAS calls in the reference, either replace with an explicit loop in the agreed order, or pin threads (`OPENBLAS_NUM_THREADS=1`) and accept that bit-exact parity holds only for that BLAS build. Intel MKL documents Conditional Numerical Reproducibility, controlled by `MKL_CBWR`; read that documentation before relying on it.
3. Change one site at a time and run the golden comparison after each change. Do NOT change many files at once.
4. Do NOT use `std::reduce` or an OpenMP reduction in code that must be bit-exact unless the grouping is fixed by your own code.
5. Emit `reduction_findings`.

### Output
`reduction_findings`.

### Quality Gate
- Every site pair has an agreed order written in the finding.
- After each change, the golden comparison was rerun and its mismatch count is recorded in the finding.

---

## Worked Example

Illustrative. Reference `energy = np.sum(x * x)`; port `for (double v : x) e += v * v;`.

```
$ python -c "import numpy as np; x=np.random.default_rng(1).standard_normal(1000); print((x*x).sum().hex(), np.cumsum(x*x)[-1].hex())"
0x1.e7d3c4d3f5318p+9 0x1.e7d3c4d3f5311p+9
```

The two orders differ in the last hex digit (7 ULPs apart) on the same data. Agreed order: sequential; the reference changes to `np.cumsum(x * x)[-1]`, goldens are regenerated under the golden policy, and the mismatch count for this entry point drops from 731 to 0.

---

## Exit Criteria

DONE when every reduction pair uses one written order on both sides and the golden comparison confirms it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reduction hidden in a library call (SciPy, Eigen) | **Adjust**: record the library and version as the order owner and test it with a dedicated vector. |
| Phase 2 | Reference change would alter released behavior | **Return**: ask the user whether the reference may change; if not, the port adopts the reference order. |
| Phase 2 | Compensated sum gives different bits on two platforms | **Stop**: check for `-fassociative-math` or contraction in that TU; both destroy compensation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
