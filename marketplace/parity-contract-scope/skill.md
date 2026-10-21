# Parity Contract Scope

**One-line description:** Writes the parity contract between a reference implementation and its port: the exact entry points, input domains including IEEE 754 special values, output types, and which side is authoritative, so every later parity step tests the same thing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_repo` (string, required): Path to the reference implementation (for example the Python package that defines correct behavior).
- `port_repo` (string, required): Path to the production port (for example the C++ library).
- `entry_points` (string[], required): The function pairs to compare, written as `reference_symbol -> port_symbol`, for example `filt.step -> filt::step`.

---

## Outputs

- `parity_contract` (object): One record per entry point pair with: reference symbol, port symbol, argument list (name, type, width, shape), input domain per argument, output list, state carried between calls, and the authoritative side.

---

## Phase 1: Pin the Entry Points

### Entry Criteria
- `reference_repo` and `port_repo` exist and build or import without errors.
- `entry_points` has at least one pair.

### Actions
1. For each pair in `entry_points`, open the reference definition and the port definition. Record the file and line of each.
2. Write the argument list of each side in order: name, type, and width. Use explicit widths: `float64`, `float32`, `int32`, `uint8`. A Python `float` is `float64`. A Python `int` has unbounded width; record the width the port uses for it.
3. Write the output list the same way. If the reference returns a tuple and the port writes through pointer or reference arguments, map each tuple element to the port argument by name.
4. Record any state carried between calls (filter memory, accumulators, RNG state). State is an input and an output of every call; list it in both.
5. Do NOT rename, refactor, or "clean up" either implementation in this phase. The contract describes the code as it is.

### Output
A draft contract table, one row per entry point pair.

### Quality Gate
- Every pair in `entry_points` has a file and line for both sides.
- Every argument and output has an explicit width (no bare `float` or `int`).
- Any argument present on one side and missing on the other is listed as a mismatch, not silently dropped.

---

## Phase 2: Define Input Domains

### Entry Criteria
- Draft contract table exists.

### Actions
1. For each floating-point argument, record the domain from the reference documentation, its asserts, or its caller. If no source exists, record the domain as an open question; do not invent a range.
2. For each floating-point argument, state whether these values are in scope: `+0.0`, `-0.0`, subnormals, `+inf`, `-inf`, quiet NaN. Use this rule: a value is in scope if the port can receive it in production (sensor fault, divide by zero upstream, uninitialized buffer). If unknown, mark it in scope.
3. For each integer argument, record minimum and maximum, and whether the port type can overflow on that range.
4. For each array argument, record allowed shapes, including length 0 and length 1.

### Output
Contract table with domains and special-value scope.

### Quality Gate
- Every floating-point argument has an explicit yes or no for each of the six special values.
- Every domain bound cites a source (doc line, assert, caller) or is listed as an open question.

---

## Phase 3: Fix Authority and Emit

### Entry Criteria
- Domains recorded.

### Actions
1. Set the authoritative side to the reference unless the user states otherwise. A mismatch is a port defect until the triage step proves the reference wrong.
2. Record both repository paths (`reference_repo`, `port_repo`) and both versions: git commit hash (`git -C <reference_repo> rev-parse HEAD`) and the port commit hash. Later flows read the paths from the contract.
3. Emit `parity_contract` as JSON, one object per entry point pair.

### Output
`parity_contract`.

### Quality Gate
- `parity_contract` parses with `python -m json.tool`.
- Both commit hashes are present and match `git rev-parse HEAD` in each repo.

---

## Worked Example

Illustrative. `entry_points = ["lowpass.step -> lp::step"]`.

Phase 1 finds `lowpass.py:41 def step(x: float, state: list[float]) -> float` and `lowpass.cpp:18 double lp::step(double x, std::array<double,2>& state)`. The contract row lists `x: float64`, `state: float64[2]` as input and output, return `y: float64`.

Phase 2 reads `assert math.isfinite(x)` at `lowpass.py:43`, so NaN and infinity are out of scope for the reference. The port receives raw sensor values, so NaN is marked in scope with an open question: "reference rejects NaN; port behavior on NaN unspecified".

Phase 3 output (excerpt):

```json
{"pair": "lowpass.step -> lp::step", "reference_repo": "ref/", "port_repo": "port/", "reference_commit": "3f2c9a1", "port_commit": "a81d004",
 "args": [{"name": "x", "type": "float64", "domain": "finite", "special": {"neg_zero": true, "subnormal": true, "nan": "open"}}],
 "state": [{"name": "state", "type": "float64", "shape": [2]}], "authoritative": "reference"}
```

---

## Exit Criteria

DONE when every entry point pair has explicit widths, domains with sources or open questions, special-value scope, carried state, commit hashes, and an authoritative side.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Port symbol not found | **Stop**: ask the user for the correct symbol; do not guess by name similarity. |
| Phase 1 | Argument counts differ between sides | **Adjust**: record the mismatch in the contract and continue; the triage step decides which side is wrong. |
| Phase 2 | No source for a domain bound | **Adjust**: record it as an open question and keep the value in scope. |
| Phase 3 | Repository has uncommitted changes | **Return**: ask the user to commit or stash so the contract pins an exact version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
