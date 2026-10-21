# Flaky Run Count Derivation

**One-line description:** Computes how many repeated runs are needed to observe a flaky failure at least once with a stated confidence, using the binomial zero-failure probability, so every later measurement and the final verification use one derived number instead of a guessed "run it 100 times".

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): From `flk-flake-evidence-intake`; supplies `failures_seen` and `runs_seen`.
- `detection_confidence` (number, required): Probability, between 0 and 1 exclusive, that the run set catches the flake if it is still present. This is the user's choice (for example the confidence their team reports elsewhere). Do not pick it for them.
- `target_flake_rate` (number, optional): The smallest per-run failure probability the user wants to detect. When absent, the CI estimate from `flake_evidence` is used.

---

## Outputs

- `repeat_count` (integer): Number of runs N used by every measurement flow and by `flk-verify-same-count`.
- `run_count_derivation` (object): `{p, p_source, c, formula, raw_value, repeat_count, expected_failures_at_p}`.

---

## Phase 1: Choose The Rate p

### Entry Criteria
- `flake_evidence.is_flaky` is true.
- `detection_confidence` is a number with 0 < c < 1.

### Actions
1. If `target_flake_rate` is present, set `p = target_flake_rate` and `p_source = "user"`.
2. Else set `p = failures_seen / runs_seen` from `flake_evidence` and `p_source = "ci_estimate (failures_seen/runs_seen)"`.
3. Apply this table:

| Condition | Action |
|---|---|
| 0 < p < 1 | Continue. |
| p == 0 (no failures counted) | **Stop**: there is no rate to derive from. Ask the user for `target_flake_rate`. |
| p >= 0.5 | Continue, but note: a test failing this often may be a deterministic failure on some runners; check `runner_facts` grouping first. |

4. Do NOT round p up or down to a "nice" number. Use the value as computed.

### Output
`p` and `p_source`.

### Quality Gate
- `p` is written with its source and, for the CI estimate, its numerator and denominator.

---

## Phase 2: Compute N

### Entry Criteria
- `p` chosen.

### Actions
1. Each run fails independently with probability p, so the probability of zero failures in N runs is (1 - p)^N. Require (1 - p)^N <= 1 - c. Solve: N >= ln(1 - c) / ln(1 - p).
2. Compute in a shell so the arithmetic is exact, not mental:
   `python -c "import math; p=0.02; c=0.95; r=math.log(1-c)/math.log(1-p); print(r, math.ceil(r))"`
   Node: `node -e "const p=0.02,c=0.95,r=Math.log(1-c)/Math.log(1-p);console.log(r,Math.ceil(r))"`
3. Set `repeat_count = ceil(raw_value)`.
4. Compute `expected_failures_at_p = repeat_count * p` and record it; it tells the reader how many failures a baseline run should show.
5. State the independence assumption in `run_count_derivation`. Flakes driven by wall-clock time (midnight, DST) are not independent across back-to-back runs; the time-zone flow covers those separately.
6. Do NOT replace N with a smaller number because the suite is slow. If N runs are too slow, run the single test (`-k`, `-t`, `-run`) instead of the suite, or split the runs across CI jobs; the count stays N.

### Output
`repeat_count`, `run_count_derivation`.

### Quality Gate
- The printed output of the command in action 2 is pasted into `run_count_derivation`.
- `(1 - p) ** repeat_count <= 1 - c` evaluates to True when checked: `python -c "print((1-0.02)**149 <= 0.05)"`.

---

## Worked Example

Illustrative. `flake_evidence` has 5 failures in 188 runs, `detection_confidence` = 0.95, no `target_flake_rate`.

- Phase 1: p = 5/188 = 0.026596, `p_source` = "ci_estimate (5/188)".
- Phase 2: `python -c "import math; p=5/188; c=0.95; r=math.log(1-c)/math.log(1-p); print(r, math.ceil(r))"` prints `111.1... 112`. `repeat_count` = 112. Expected failures at p over 112 runs = 2.98. Check: `python -c "print((1-5/188)**112 <= 0.05)"` prints `True`.

---

## Exit Criteria

DONE when `repeat_count` is the ceiling of ln(1 - c) / ln(1 - p) with p and c both traced to a source, and the inequality check prints True.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | p is 0 | **Stop**: ask the user for `target_flake_rate`. |
| Phase 1 | `detection_confidence` missing or outside (0, 1) | **Stop**: ask the user; do not default it. |
| Phase 2 | N is larger than the user can run locally | **Adjust**: run only `test_id` in isolation, or shard N runs across CI jobs; never lower N. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
