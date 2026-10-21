# Python Benchmark Harness with pytest-benchmark

**One-line description:** Writes a pytest-benchmark test for the slow Python function at each workload size, runs it with warmup, explicit rounds and GC control, and saves the raw timings as JSON for the baseline.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`.
- `workload_spec` (object, required): Sizes, inputs, warmup and repetition counts.
- `bench_env_report` (object, required): From `perf-bench-env-stabilize`; supplies the pinned core.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_bench_raw` (object): Path to `perf/bench/py_baseline.json` (pytest-benchmark JSON with raw data), the exact command used, the pytest-benchmark version, and per-benchmark median, IQR, stddev, rounds and outlier counts.

---

## Phase 1: Install and Write the Benchmark

### Entry Criteria
- `perf_spec.level` is `micro benchmark`, or the user asked for an in-process Python benchmark.
- `python -m pytest --version` exits 0 in the project's virtual environment.

### Actions
1. Install: `python -m pip install pytest-benchmark`. Record `python -m pip show pytest-benchmark` (Version line).
2. Create one new file `benchmarks/test_bench_<target>.py`. Do not put benchmarks inside existing unit test files and do not edit any existing test.
3. Build inputs once, outside the timed call, at module level or in a fixture, for every size in `workload_spec.sizes`. Use `@pytest.mark.parametrize("size", [...])` with the sizes.
4. Call the real function through the `benchmark` fixture and assert on the result so a broken function cannot benchmark fast:

```python
import pytest
from app.report import build_report      # the real function; do not invent names, grep for it first
from benchmarks.data import load_rows     # loads workload_spec inputs

SIZES = [30_000, 120_000]                 # copied from workload_spec.sizes

@pytest.mark.parametrize("size", SIZES)
def test_build_report(benchmark, size):
    rows = load_rows(size)                # built outside the timed region
    result = benchmark(build_report, rows)
    assert result.total_rows == size      # proves the work happened
```

5. If the function mutates its input, use `benchmark.pedantic(build_report, setup=make_args, rounds=R, iterations=1)` where `make_args` returns `(args, kwargs)` fresh each round. With `setup`, `iterations` must be 1.
6. If the function returns a generator or lazy iterator, wrap it: `benchmark(lambda r: list(build_report(r)), rows)`. Otherwise only the creation of the generator is timed.

### Output
`benchmarks/test_bench_<target>.py`.

### Quality Gate
- `grep -n "def test_" benchmarks/test_bench_<target>.py` shows one function per target, parametrized over all sizes.
- `python -m pytest benchmarks/test_bench_<target>.py --benchmark-disable -q` passes (runs each once as a plain test).

---

## Phase 2: Run with Warmup and Fixed Settings

### Entry Criteria
- The benchmark passes in disabled mode.

### Actions
1. Run with this command (Linux, pinned core from `bench_env_report`):

```bash
taskset -c <core> python -m pytest benchmarks/test_bench_<target>.py \
  --benchmark-only \
  --benchmark-warmup=on \
  --benchmark-min-rounds=<rounds from workload_spec> \
  --benchmark-disable-gc \
  --benchmark-save-data \
  --benchmark-json=perf/bench/py_baseline.json \
  --benchmark-columns=min,median,iqr,stddev,rounds,outliers \
  -p no:xdist -p no:cacheprovider
```

2. Flag decisions:

   | Situation | Flag |
   |---|---|
   | CPython (warmup default is off except on PyPy) | `--benchmark-warmup=on`; set count with `--benchmark-warmup-iterations=<n>` if `workload_spec` gives one |
   | Production code runs with GC enabled and allocation is part of the cost | drop `--benchmark-disable-gc` and record why |
   | pytest-cov is installed and active via `addopts` | add `--no-cov`; coverage tracing slows every line |
   | pytest-xdist installed | keep `-p no:xdist`; parallel workers compete for the CPU |
   | Need raw per-round times for significance testing | keep `--benchmark-save-data` |

3. Do not pass flags you have not confirmed. Check the full list with `python -m pytest --help | grep benchmark`.

### Output
`perf/bench/py_baseline.json` and console table.

### Quality Gate
- The console table has one row per size with a `Rounds` value greater than or equal to the requested minimum.
- `python -c "import json;d=json.load(open('perf/bench/py_baseline.json'));print([len(b['stats']['data']) for b in d['benchmarks']])"` prints a non-empty count for every benchmark.

---

## Phase 3: Read the Output and Record

### Entry Criteria
- JSON written.

### Actions
1. Read the columns: `Min`, `Median`, `IQR`, `StdDev`, `Rounds`, `Outliers`. The `Outliers` column has the form `A;B`: A = rounds more than 1 standard deviation from the mean, B = rounds more than 1.5 IQR from the quartiles (pytest-benchmark documentation).
2. Use `Median` as the statistic named in `perf_spec`. Do not report `Min` as the result; it hides variance.
3. If `Outliers` B is a large share of `Rounds`, rerun once after checking `uptime`; record both runs.
4. Fill `py_bench_raw` with the JSON path, the full command, the version, and per-size `median`, `iqr`, `stddev`, `rounds`, `outliers`, and the unit.

### Output
`py_bench_raw`.

### Quality Gate
- `py_bench_raw.command` is the exact string that was run.
- Every size in `workload_spec.sizes` has a median in `py_bench_raw`.

---

## Worked Example

Illustrative. Target `app.report.build_report`, sizes 30,000 and 120,000 rows, pinned core 2.

- Phase 1: `benchmarks/test_bench_build_report.py` written; `pytest ... --benchmark-disable -q` prints `2 passed`.
- Phase 2: command run as above with `--benchmark-min-rounds=20`.
- Phase 3: table

```
Name (time in s)                 Min      Median     IQR      StdDev   Rounds  Outliers
test_build_report[30000]       2.8410    2.9022    0.0391    0.0402      20      3;1
test_build_report[120000]     44.1203   45.0107    0.6120    0.5814      20      4;0
```

Size ratio 4x, time ratio 15.5x: the time grows much faster than the input. This feeds `perf-hotspot-classify`.

---

## Exit Criteria

DONE when `perf/bench/py_baseline.json` holds raw per-round data for every size, the command and version are recorded, and the benchmark asserts on the real function's result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Function name not found | **Stop**: `grep -rn "def <name>" <repo_path>`; never benchmark an invented function. |
| Phase 1 | Function needs a database or network | **Adjust**: use the process-level `perf-hyperfine-cli-harness` instead, or a local fixture database; record which. |
| Phase 2 | Warning "Benchmarks are automatically disabled because xdist plugin is active" | **Retry**: add `-p no:xdist`. |
| Phase 2 | Each round takes minutes | **Adjust**: use `benchmark.pedantic(..., rounds=<user count>, iterations=1)` and record the reduced count as a user decision. |
| Phase 3 | Median differs between two clean runs by more than their IQR | **Return**: to `perf-bench-env-stabilize`; the machine is not quiet. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
