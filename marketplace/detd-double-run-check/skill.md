# Double Run Determinism Check

**One-line description:** Runs the decision program on one fixed input in fresh processes under a perturbation matrix (hash seed, thread count, address space randomization, time zone, locale, working directory) and compares the output bytes with `cmp`, so hidden nondeterminism shows up as a first differing byte.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `run_command` (string, required): Command that reads one input file and writes the decision output to a file, for example `python -m planner.run --in {input} --out {output}`. Must contain the `{input}` and `{output}` placeholders.
- `sample_input` (string, required): Path to one input file representative of normal operation.
- `nondeterminism_sources` (object[], required): Output of `detd-nondeterminism-inventory`; used to choose which perturbations matter.

---

## Outputs

- `double_run_report` (object[]): One row per perturbation: `perturbation`, `command`, `sha256_a`, `sha256_b`, `identical` (true or false), and `cmp_output` (the line `cmp` prints, for example `out_a differ: byte 1913, line 40`).

---

## Phase 1: Baseline Twin Run

### Entry Criteria
- `run_command` contains `{input}` and `{output}`.
- Running it once exits 0 and writes a non-empty output file.

### Actions
1. Create a scratch directory outside the repo: `mkdir -p /tmp/detd_dr`.
2. Run the command twice with nothing changed, each time in a new process, writing `out_base_a` and `out_base_b`.
3. Compare: `cmp /tmp/detd_dr/out_base_a /tmp/detd_dr/out_base_b; echo exit=$?`. `cmp` exits 0 when identical, 1 when different, 2 on error.
4. Record `sha256sum` of both files.

### Output
Baseline row of `double_run_report`.

### Quality Gate
- `cmp` exit status is recorded (0, 1 or 2), not inferred.
- If exit is 1, stop the matrix: the program is not even repeatable unperturbed. Go to Error Handling.

---

## Phase 2: Perturbation Matrix

### Entry Criteria
- Baseline twin run is identical.

### Actions
1. Run each pair below. Change exactly one factor per pair. Run A and B in separate processes.

| perturbation | run A | run B | targets category |
|---|---|---|---|
| hash seed (python) | `PYTHONHASHSEED=0` | `PYTHONHASHSEED=1` | hash_order |
| thread count | `OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1` | same variables set to the value of `nproc` | scheduling, float |
| go scheduler | `GOMAXPROCS=1` | `GOMAXPROCS=$(nproc)` | scheduling |
| tokio or rayon | `RAYON_NUM_THREADS=1` | `RAYON_NUM_THREADS=$(nproc)` | scheduling |
| address layout (Linux) | `setarch "$(uname -m)" -R <cmd>` (disables randomization) | `<cmd>` normally | hash_order with pointer keys |
| time zone | `TZ=UTC` | `TZ=America/Chicago` | clock |
| locale | `LC_ALL=C` | `LC_ALL=en_US.UTF-8` (check `locale -a` lists it) | environment, number formatting |
| working directory | run from `/tmp/detd_dr/a` | run from `/tmp/detd_dr/b` with a different file creation order | io_order |
| wall clock offset | run now | run again once `date +%s` prints a different value than at run A | clock |

2. Skip a row only when its variable cannot apply to the `stack` (for example `PYTHONHASHSEED` for a C++ binary); record "not applicable" with the reason.
3. For each pair run `cmp` and record the line it prints.

### Output
Complete `double_run_report`.

### Quality Gate
- Every row has `identical` set from a `cmp` exit status, never from eyeballing.
- Every non-identical row names the `nondeterminism_sources` category it points to.

---

## Phase 3: Locate the First Difference

### Entry Criteria
- At least one non-identical row, or all identical (then skip to Exit).

### Actions
1. For text output, run `diff <(head -c 4096 out_a) <(head -c 4096 out_b)` around the byte offset that `cmp` printed, or `cmp -l out_a out_b | head` to list differing bytes.
2. For binary output, run `cmp -l out_a out_b | head -n 20` and map the first offset to the record that contains it using the record schema.
3. Add the decoded field name to the row.

### Output
Each failing row names its first differing field.

### Quality Gate
- Each failing row carries a byte offset and a field name.

---

## Worked Example

Illustrative only. `run_command="python -m planner.run --in {input} --out {output}"`.

Baseline: `cmp out_base_a out_base_b; echo exit=$?` prints `exit=0`.

Hash seed row: `PYTHONHASHSEED=0 python -m planner.run --in drive_017.jsonl --out out_a` and the same with `PYTHONHASHSEED=1`. `cmp out_a out_b` prints `out_a out_b differ: byte 1913, line 40`. Line 40 is the `active_limits` list, built by iterating a `set` of strings. Category hash_order, fix sort_before_iterate.

---

## Exit Criteria

DONE when every applicable perturbation row has a `cmp` result, and each difference is traced to a field and a category.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unperturbed twin run differs | **Stop**: return to `detd-nondeterminism-inventory`; clocks or RNG are unseeded. Inject them first. |
| Phase 1 | Command exits non-zero | **Stop**: fix the command; a crash is not a determinism result. |
| Phase 2 | `setarch` missing | **Adjust**: install `util-linux`; on non-Linux record the row as not run. |
| Phase 3 | Output format unknown | **Return**: ask for the record schema before decoding offsets. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
