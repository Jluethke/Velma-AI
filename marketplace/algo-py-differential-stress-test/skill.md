# Python Randomized Differential Stress Test

**One-line description:** Runs a seeded randomized differential test of a Python solution against the brute-force reference (subprocess loop with exact diff or a checker, plus an optional Hypothesis property test that shrinks failures), weighted toward tiny inputs, and minimizes any failing input into a saved counterexample.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with constraint table and output contract.
- `solution_file` (string, required): Path of the solution, for example `sol.py`.
- `brute_file` (string, required): Path of the reference, for example `brute.py`.
- `brute_force_limits` (object, required): Output of `algo-brute-force-reference`, with `max_brute_n`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stress_iterations` (integer, optional): Number of random tests to run. If absent, the subprocess loop asks the user, and the Hypothesis test uses Hypothesis's documented default `max_examples` of 100.
- `py_runtime_report` (object, required): Output of `algo-py-runtime-pitfalls`; the audited solution is the one under test.

---

## Outputs

- `stress_report` (object): Generator description, seeds range run, iteration count, pass count, timeouts, the checker used, and the edge-case replay result.
- `counterexample` (object): The smallest failing input file, the solution output, the reference output, and the seed. Null when no failure was found.

---

## Phase 1: Generator and Checker

### Entry Criteria
- `brute_file` passes all samples; `solution_file` passes all samples.

### Actions
1. Write `gen.py` that takes a seed as `sys.argv[1]`, creates `rng = random.Random(seed)` (never the global `random` without a seed, which makes failures unreproducible), and prints one valid input.
2. Size and value rules for the generator:
   - Draw n mostly from tiny sizes: for example `n = rng.randint(1, rng.choice([3, 6, max_brute_n]))`, so most tests are tiny and some reach `max_brute_n`. Record the exact distribution in `stress_report`.
   - Draw values from a small range (for example 1..5) in most tests so duplicates, ties and exact equalities occur; draw from the full constraint range in the rest.
   - For graphs, generate trees with `parent[i] = rng.randrange(i)`, then add extra edges; relabel nodes with a random permutation so the structure is not always rooted at node 1.
   - Every generated input must satisfy the constraints; for multi-test inputs, keep the sum-of-n bound.
3. Checker by output contract from `problem_spec`:

| Contract | Comparison |
|---|---|
| unique | exact token comparison: `got.split() == exp.split()` |
| any valid | `check.py input got exp` validates the solution's answer against the input and compares its objective value with the reference value |
| real tolerance | parse floats; pass when `abs(a - b) <= tol * max(1, abs(b))` with tol from the statement |

### Output
`gen.py` and the checker.

### Quality Gate
- `python gen.py 1` and `python gen.py 1` print identical text (determinism), and `python gen.py 2` prints different text.
- A constraint validator `validate.py` (reads one input, asserts every bound in the constraint table, exits 0) exits 0 on `python gen.py 1`, and Phase 2 can call it on every generated input.

---

## Phase 2: Run the Differential Loop

### Entry Criteria
- Generator and checker ready. `stress_iterations` known or the user asked.

### Actions
1. Write `stress.py`:

```
import subprocess, sys
N = int(sys.argv[1])
for seed in range(1, N + 1):
    inp = subprocess.run([sys.executable, "gen.py", str(seed)], capture_output=True, text=True, check=True).stdout
    try:
        got = subprocess.run([sys.executable, "sol.py"], input=inp, capture_output=True, text=True, timeout=TL)
    except subprocess.TimeoutExpired:
        print("TIMEOUT seed", seed); open("fail.in", "w").write(inp); sys.exit(1)
    exp = subprocess.run([sys.executable, "brute.py"], input=inp, capture_output=True, text=True).stdout
    if got.returncode != 0 or got.stdout.split() != exp.split():
        print("MISMATCH seed", seed); open("fail.in", "w").write(inp); sys.exit(1)
print("OK", N)
```

TL is the problem's `time_limit_seconds` from `problem_spec`. Swap the comparison line for the checker when the contract is not "unique".
2. Run `python stress.py <stress_iterations>`. Do not stop at the first "OK" on a handful of tests and claim the solution is verified; report the exact count run.
3. Replay every edge case file too: `for f in edge_*.in; do python sol.py < $f > got.txt && diff -w got.txt ${f%.in}.out || echo "FAIL $f"; done` (skip files marked time-only for the value check).
4. Optional property test with Hypothesis (`pip install hypothesis`), when the solution exposes a `solve` function:

```
from hypothesis import given, settings, strategies as st
import sol, brute
@settings(deadline=None)
@given(st.lists(st.integers(min_value=1, max_value=5), min_size=1, max_size=8))
def test_same(a):
    assert sol.solve(a) == brute.solve(a)
```

Run with `python -m pytest test_stress.py`. `deadline=None` disables Hypothesis's default per-example deadline of 200 ms, which would otherwise fail slow brute-force examples as flaky. On failure, Hypothesis prints a shrunk "Falsifying example:".

### Output
Loop result and edge replay result.

### Quality Gate
- `stress.py` printed `OK <count>` with count equal to `stress_iterations`, or printed a failing seed.
- The edge replay prints no FAIL line.

---

## Phase 3: Minimize and Report

### Entry Criteria
- Phase 2 finished.

### Actions
1. If a failure occurred: rerun the failing seed alone to confirm it reproduces. Then shrink: delete elements or lower values one at a time from `fail.in` while it still fails, keeping it valid. Stop when no single deletion keeps it failing. Hypothesis does this automatically for the property test.
2. Before blaming the solution, check the reference: work the minimized input by hand. If the reference is wrong, **Return** to `algo-brute-force-reference`; never change the reference just to agree with the solution.
3. Save the minimized input as `counterexample.in` plus both outputs, and fill `counterexample`.
4. Do not edit `solution_file` in this flow. The fix belongs to the technique flow, after which this flow reruns from Phase 2 with the same seeds.

### Output
`stress_report`, `counterexample`.

### Quality Gate
- If `counterexample` is not null, `python sol.py < counterexample.in` and `python brute.py < counterexample.in` print different outputs when run now.
- `stress_report` records the seed range, the count, and the generator distribution.

---

## Worked Example

Illustrative. Longest subarray with sum at most k; `max_brute_n` = 200; `stress_iterations` = 2000.

- Phase 1: `gen.py` draws n from 1..`rng.choice([3, 6, 200])`, values 1..5 in 80 percent of tests, 1..10^9 otherwise, k from 1 to 3 * max value.
- Phase 2:

```
$ python stress.py 2000
MISMATCH seed 317
```

- Phase 3: `fail.in` minimized from n=6 to "1 3\n4\n" (n=1, k=3, a=[4]): solution prints 1, reference prints 0. `counterexample` filled; returned to `algo-sliding-window`, where the answer update ran before the shrink loop. After the fix, `python stress.py 2000` prints `OK 2000`.

---

## Exit Criteria

DONE when the loop ran the requested count with no mismatch and the edge replay passed, or when a minimized, reproducible `counterexample` is saved and returned to the technique flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Generator output violates constraints | **Adjust**: fix the generator; a mismatch on invalid input means nothing. |
| Phase 2 | `stress_iterations` absent | **Stop**: ask the user for the count for the subprocess loop; the Hypothesis test may still run with its default. |
| Phase 2 | TIMEOUT on a small input | **Return**: to the technique flow; a small input should never hit the time limit (likely an infinite loop). |
| Phase 3 | Failure does not reproduce with the same seed | **Adjust**: the code reads global state or time; make the generator and solution deterministic and rerun. |
| Phase 3 | Reference is wrong on the minimized input | **Return**: to `algo-brute-force-reference`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
