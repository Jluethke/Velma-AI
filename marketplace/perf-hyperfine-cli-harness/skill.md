# Process-Level Benchmark Harness with hyperfine

**One-line description:** Benchmarks a whole command (CLI tool, batch job, compiled binary in any language) with hyperfine, choosing warm or cold cache runs, shell or no-shell spawning and parameter scans over input sizes, and exports every run time as JSON.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`.
- `workload_spec` (object, required): Command, sizes, cache choice, run counts.
- `bench_env_report` (object, required): Pinned core and machine state.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `cli_bench_raw` (object): Path to `perf/bench/cli_baseline.json` (hyperfine export with per-run `times`), the exact hyperfine command, hyperfine version, the build command and binary checksum, and per-size mean, median, stddev, min, max and run count.

---

## Phase 1: Build and Prepare the Command

### Entry Criteria
- `hyperfine --version` exits 0. Install if missing: `cargo install hyperfine`, `brew install hyperfine`, `apt install hyperfine` (Debian 12+, Ubuntu 22.04+), or `winget install sharkdp.hyperfine`.

### Actions
1. Build the release artifact once with the project's release command and record it:

   | `stack` | Release build |
   |---|---|
   | `rust` | `cargo build --release` |
   | `go` | `go build -o bin/app ./cmd/app` |
   | `c`, `cpp` | the project's CMake or Make release target, for example `cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build` |
   | `jvm` | `mvn -q package -DskipTests` then `java -jar target/app.jar` |
   | `node` | `npm run build` then `node dist/cli.js` |
   | `python` | no build; record `python --version` and the virtual environment path |

2. Record the SHA-256 of the binary or jar. Never benchmark a debug build (`target/debug`, `-O0`, `CMAKE_BUILD_TYPE=Debug`).
3. Write the command with the input size as a placeholder `{size}` and input files named by size, for example `./target/release/report --input data/orders_{size}.csv`.
4. Send command output to `/dev/null` inside the command or let hyperfine discard it (hyperfine discards stdout by default; check `--output` in `hyperfine --help`). Terminal printing is slow and not part of the workload.

### Output
Release artifact and templated command.

### Quality Gate
- The command runs once for each size with exit code 0.
- The binary checksum is recorded.

---

## Phase 2: Choose Flags and Run

### Entry Criteria
- Command works for each size.

### Actions
1. Choose flags with this table:

   | Condition | Flag |
   |---|---|
   | `workload_spec` says warm cache | `--warmup <n>` with n from `workload_spec` (hyperfine default is 0) |
   | `workload_spec` says cold cache (Linux) | `--prepare 'sync; echo 3 \| sudo tee /proc/sys/vm/drop_caches'` |
   | Command finishes in a few milliseconds | `-N` (`--shell=none`) so shell spawn time is not measured; hyperfine warns when a command is too short |
   | Several sizes | `-P size <low> <high> -D <step>` for a numeric range, or `-L size 30000,120000` for a list |
   | Run count from `workload_spec` | `--runs <n>`, else keep hyperfine's default minimum of 10 runs and 3 seconds |
   | Command may fail on some runs | do not add `-i`; investigate the failure instead |

2. Run on the pinned core:

```bash
taskset -c <core> hyperfine --warmup <n> -L size 30000,120000 \
  --export-json perf/bench/cli_baseline.json \
  --export-markdown perf/bench/cli_baseline.md \
  './target/release/report --input data/orders_{size}.csv'
```

3. Do not run two hyperfine sessions at once and do not use the machine during the run.

### Output
`perf/bench/cli_baseline.json` and `.md`.

### Quality Gate
- hyperfine exits 0.
- `python -c "import json;print([len(r['times']) for r in json.load(open('perf/bench/cli_baseline.json'))['results']])"` prints a run count for every size.

---

## Phase 3: Read Warnings and Record

### Entry Criteria
- Export exists.

### Actions
1. Read each block: `Time (mean ± σ): 1.203 s ± 0.012 s [User: 1.150 s, System: 0.048 s]` and `Range (min … max)`. Use the median from the JSON (`results[i].median`) as the statistic.
2. Act on hyperfine warnings:

   | Warning text contains | Action |
   |---|---|
   | `Statistical outliers were detected` | rerun after checking `uptime`; if it persists, record it |
   | `The first benchmarking run for this command was significantly slower` | caches matter; add `--warmup` for a warm-cache spec or `--prepare` for cold |
   | `Command took less than 5 ms` | add `-N` |

3. Compare User + System with wall time. If wall time is much larger than User + System, the process is waiting (I/O, sleep, network). Record "off-CPU dominant"; `perf-hotspot-classify` uses it.
4. Fill `cli_bench_raw`.

### Output
`cli_bench_raw`.

### Quality Gate
- Every size has a median and a `times` array in the JSON.
- Every warning printed is listed in `cli_bench_raw.warnings` with the action taken.

---

## Worked Example

Illustrative. Rust CLI `report`, sizes 30,000 and 120,000, warm cache, 2 warmup runs.

```
Benchmark 1: ./target/release/report --input data/orders_30000.csv
  Time (mean ± σ):      1.203 s ±  0.012 s    [User: 1.150 s, System: 0.048 s]
  Range (min … max):    1.188 s …  1.226 s    10 runs
Benchmark 2: ./target/release/report --input data/orders_120000.csv
  Time (mean ± σ):     18.911 s ±  0.140 s    [User: 18.702 s, System: 0.190 s]
  Range (min … max):   18.744 s … 19.120 s    10 runs
```

User + System close to wall time: on-CPU dominant. 4x input, 15.7x time.

---

## Exit Criteria

DONE when `perf/bench/cli_baseline.json` holds per-run times for every size of a release build, the flags follow the table, and every warning has a recorded action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only a debug build exists | **Stop**: build release first; debug numbers are not comparable. |
| Phase 2 | `Command terminated with non-zero exit code` | **Stop**: run the command by hand and fix the failure; do not add `-i`. |
| Phase 2 | No sudo for cache drop | **Adjust**: measure warm and record that cold was not possible. |
| Phase 3 | Outlier warning on every rerun | **Return**: to `perf-bench-env-stabilize`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
