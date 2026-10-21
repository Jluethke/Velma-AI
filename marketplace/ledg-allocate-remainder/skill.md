# Ledger Allocate With Remainder

**One-line description:** Implements integer-only splitting of a money amount by weights with the largest remainder method, so the parts always sum to the original amount, ties break deterministically, and negative totals split symmetrically; for refunds, installments, revenue shares and multi-party fees.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rounding_policy` (object, required): Output of `ledg-rounding-policy`; must contain an `allocation_split` point.
- `stack` (string, required): One of `python`, `java`, `node`, `go`.

---

## Outputs

- `allocation_function` (object): File path and signature of `allocate(total_minor, weights) -> parts`, the tie-break rule, the sign rule, and the passing test command.

---

## Phase 1: Specify the Algorithm

### Entry Criteria
- `rounding_policy` has an `allocation_split` point, or the user confirms one is needed.

### Actions
1. Inputs to the function: `total` (integer minor units, any sign) and `weights` (list of non-negative integers, at least one positive). Percentages like 33.3% become integer weights by scaling (333, 333, 334); never pass floats.
2. Algorithm (largest remainder, also called Hamilton's method):
   1. `W = sum(weights)`. `T = abs(total)`.
   2. For each i: `base_i = (T * w_i) // W` and `rem_i = (T * w_i) % W`.
   3. `left = T - sum(base_i)`; `0 <= left < len(weights)`.
   4. Give one extra unit to the `left` indexes with the largest `rem_i`; break ties by lower index first.
   5. If `total < 0`, negate every part.
3. Tie-break rule is part of the contract; write it in the docstring. Lower index first makes results stable across runs.
4. Overflow: `T * w_i` can exceed 64 bits. Python `int` is unbounded; in Java use `Math.multiplyExact` or `BigInteger`; in Go use `math/big` or `bits.Mul64` with `bits.Div64`; in JavaScript use `bigint`.
5. Never do `total / n` and round each part; three parts of 100 cents rounded give 33+33+33 = 99.

### Output
Algorithm spec with tie and sign rules.

### Quality Gate
- The spec states the tie-break and sign rule in one sentence each.
- The spec states the overflow-safe multiply for the chosen `stack`.

---

## Phase 2: Implement for the Stack

### Entry Criteria
- Algorithm spec exists.

### Actions
1. Write the function in the money module for the `stack` (one file).

| `stack` | Implementation notes |
|---|---|
| python | `divmod(T * w, W)`; sort indexes with `sorted(range(n), key=lambda i: (-rem[i], i))`. |
| java | `long` with `Math.multiplyExact`, fall back to `BigInteger` on `ArithmeticException`; return `long[]`. |
| node | `bigint` throughout: `(T * w) / W` and `%`; convert to `number` only after `Number.isSafeInteger` check. If dinero.js is in use, its `allocate` already distributes remainders; still run Phase 3 tests against it. |
| go | `int64` with `bits.Mul64`/`bits.Div64` on absolute values, or `math/big.Int`; sort with `sort.SliceStable`. |

2. Reject invalid input: empty weights, any negative weight, or all-zero weights raise an error.

### Output
Allocation function in code.

### Quality Gate
- The project compiles or imports cleanly (`python -c "import <pkg>.money"`, `./mvnw -q compile`, `npx tsc --noEmit`, `go build ./...`).

---

## Phase 3: Test the Invariants

### Entry Criteria
- Function compiles.

### Actions
1. Example tests: `allocate(100, [1,1,1])` returns `[34,33,33]`; `allocate(-100, [1,1,1])` returns `[-34,-33,-33]`; `allocate(5, [0,1])` returns `[0,5]`; `allocate(1, [1,1])` returns `[1,0]`.
2. Invariant checks written as plain tests now (property versions come in the stack test flow): sum of parts equals `total`; each part differs from the exact share `total*w_i/W` by less than one unit; zero weight gets zero.
3. Run the stack's test command and record the summary line.
4. Do not change expected values to match output; if `[33,33,34]` comes back, the tie-break is wrong.

### Output
`allocation_function`.

### Quality Gate
- All four example tests pass.
- The sum-equals-total test passes for every example.

---

## Worked Example

Illustrative only. Split a 1000 JPY fee 3 ways by weights 1:1:1 and 10.00 USD by 70:30.
```
>>> allocate(1000, [1, 1, 1])
[334, 333, 333]
>>> allocate(1000, [70, 30])
[700, 300]
>>> allocate(-1001, [1, 1])
[-501, -500]
$ pytest -q -k allocate
5 passed
```

---

## Exit Criteria

DONE when `allocate` is integer-only, deterministic, sum-preserving for any sign, overflow-safe for the `stack`, and its example and invariant tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Business wants remainders to a specific party | **Adjust**: put that party first in the weights list and document it as the tie-break rule. |
| Phase 2 | Weights arrive as decimal percentages | **Adjust**: scale to integers with the decimal parser; reject inputs with more digits than the agreed scale. |
| Phase 3 | Sum test fails | **Stop**: fix the algorithm; never add a correction to the last part to force the sum. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
