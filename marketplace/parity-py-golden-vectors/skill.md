# Parity Python Golden Vectors

**One-line description:** Generates golden test vectors from a Python reference implementation: hand-picked edge cases, IEEE 754 special values, and seeded random cases, all written in the canonical serialization with the generator version recorded.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_repo` (string, required): Path to the Python reference package.
- `parity_contract` (object, required): Output of `parity-contract-scope`.
- `serialization_spec` (object, required): Output of `parity-canonical-serialization`.
- `seed` (integer, optional): Seed for random cases. If absent, generate one with `python -c "import secrets; print(secrets.randbits(32))"` and record it.

---

## Outputs

- `golden_vectors` (string): Path to the directory of generated vector files, one file per entry point pair, plus `generator_info.json`.

---

## Phase 1: Build the Case List

### Entry Criteria
- `parity_contract` lists domains and special-value scope for every argument.

### Actions
1. Create `tests/parity/gen_golden.py` in `reference_repo` (a generator script in the reference repo, not in this flow).
2. For each argument, add edge cases from the contract domain: each bound, one ULP inside each bound (`math.nextafter(lo, math.inf)`, Python 3.9+), zero, `-0.0`.
3. Add every special value the contract marks in scope: `5e-324`, `2.2250738585072014e-308`, `sys.float_info.max`, `math.inf`, `-math.inf`, `math.nan`.
4. Add random cases with `rng = numpy.random.default_rng(seed)`. Draw inside the domain with `rng.uniform(lo, hi, n)`. Also draw random bit patterns with `rng.integers(0, 2**64, n, dtype=numpy.uint64).view(numpy.float64)` and keep those inside the domain; this hits subnormals and odd exponents that uniform draws never reach.
5. The case count `n` is a user input. Do not pick a number and present it as required.
6. For stateful entry points, generate sequences of calls (the state is carried), not single calls. Record the initial state in each sequence.

### Output
Case list in memory with a label per case: `edge`, `special`, `random_uniform`, `random_bits`.

### Quality Gate
- Every in-scope special value from `parity_contract` appears in at least one case.
- `seed` is recorded in the output.

---

## Phase 2: Run the Reference and Write Vectors

### Entry Criteria
- Case list built.

### Actions
1. Pin the environment before running: record `python --version`, `numpy.__version__`, and `platform.machine()`.
2. Set `OPENBLAS_NUM_THREADS=1`, `MKL_NUM_THREADS=1`, and `OMP_NUM_THREADS=1` before importing NumPy if the reference calls linear algebra, so BLAS reduction order does not depend on thread count.
3. Call the reference for every case. Catch exceptions per case and record the exception type as the expected output (`{"raises": "ValueError"}`); the port must report the same error class through its own mechanism.
4. Write inputs and outputs using the exact encoding in `serialization_spec` (bit patterns, not decimal text).
5. Write `generator_info.json`: reference commit, Python and NumPy versions, machine, seed, case counts per label, the generator command line.
6. Do NOT post-process reference outputs (no rounding, no clipping). The reference output is the golden value as computed.

### Output
`golden_vectors` directory.

### Quality Gate
- `python tests/parity/gen_golden.py --seed <seed>` run twice produces byte-identical files (check with `sha256sum`).
- Every file decodes with the `serialization_spec` decoder with zero errors.

---

## Worked Example

Illustrative. One entry point `lowpass.step`, `seed = 2718281`, user asks for 5000 random cases.

```
$ OPENBLAS_NUM_THREADS=1 python tests/parity/gen_golden.py --seed 2718281 --n 5000 --out golden/
wrote golden/lowpass_step.jsonl: edge=14 special=6 random_uniform=5000 random_bits=812
$ sha256sum golden/lowpass_step.jsonl; python tests/parity/gen_golden.py --seed 2718281 --n 5000 --out /tmp/g2 && sha256sum /tmp/g2/lowpass_step.jsonl
9c1e...  golden/lowpass_step.jsonl
9c1e...  /tmp/g2/lowpass_step.jsonl
```

`random_bits` kept 812 of 5000 draws that fell inside the domain.

---

## Exit Criteria

DONE when the vectors regenerate byte-identically from the recorded seed, cover every in-scope special value, and carry generator metadata.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Contract domain is an open question | **Adjust**: generate from the full finite range and flag the cases in `generator_info.json`. |
| Phase 2 | Two runs produce different hashes | **Stop**: find the nondeterminism (thread count, dict ordering, unseeded RNG, time-based input) before writing goldens. |
| Phase 2 | Reference raises on a case in its own domain | **Return**: report it as a reference defect to the user; do not drop the case. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
