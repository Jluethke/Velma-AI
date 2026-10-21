# Port Hyperfine Performance Compare

**One-line description:** Compares the source and the ported program on the same workload with hyperfine (release builds, warmup runs, exported JSON), separates startup cost from steady-state cost, reads hyperfine's mean, standard deviation and relative summary correctly, and, when the port is slower than the user's budget, names the profiler to run for the target language.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source at the reference commit.
- `target_repo` (string, required): Path to the ported target.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`; its inputs are the default workload.
- `parity_report` (object, required): Output of `port-parity-diff-triage`. Performance is compared only on a port whose verdict is `PARITY`.
- `perf_budget` (string, optional): The user's acceptance rule, for example "target mean no more than the source mean" or a latency target from an SLO. Without it, the report states results without a pass or fail verdict.

---

## Outputs

- `perf_report` (object): Machine and toolchain description, workloads, hyperfine JSON and Markdown exports per workload, means with standard deviations, the relative summary, the verdict against `perf_budget` (or "no budget given"), and profiler commands to run if the verdict is fail.

---

## Phase 1: Build Comparable Executables

### Entry Criteria
- `parity_report` verdict is `PARITY`.
- `hyperfine --version` prints a version (install from the hyperfine releases page, `cargo install hyperfine`, or the OS package manager).

### Actions
1. Build each side in its production mode:

| Language | Build | Run command |
|---|---|---|
| Python | none; same interpreter version as `ENV.json` | `python -m <pkg> ...` |
| JavaScript | as shipped | `node dist/cli.js ...` |
| TypeScript | `npx tsc -p .` (or the project bundler) | `node dist/cli.js ...` (never through `ts-node` or `tsx`, which add compile time) |
| Go | `go build -o bin/app ./cmd/app` | `./bin/app ...` |
| Java / Kotlin | `./gradlew installDist` or the shaded JAR | `build/install/app/bin/app ...` or `java -jar app.jar ...` with the same JVM flags as production |
| C | the project's release flags | `./build/app ...` |
| Rust | `cargo build --release` | `./target/release/app ...` |

2. If the behavior is a library function with no CLI, write a minimal driver in each language that reads a workload file and calls the function for each input, printing a checksum of results (so work cannot be optimized away). The two drivers must do the same work; confirm by comparing their printed checksums.
3. Define workloads: (a) the golden corpus inputs replayed once (realistic mix); (b) a user-provided production-sized input if available. Do not invent a size; ask the user.

### Output
Two executables or drivers, and workload files.

### Quality Gate
- Both sides print identical output (or checksum) for each workload: `diff <(source cmd) <(target cmd)` prints nothing.

---

## Phase 2: Measure

### Entry Criteria
- Phase 1 complete; the machine is otherwise idle (close other heavy processes; on laptops, plug in power).

### Actions
1. Run:
```
hyperfine --warmup 3 \
  --export-json perf-<workload>.json --export-markdown perf-<workload>.md \
  -n source '<source command> <workload>' \
  -n target '<target command> <workload>'
```
   hyperfine's defaults run each command at least 10 times and for at least 3 seconds; keep the defaults unless the user specifies `--runs`. `--warmup` runs are not measured and fill file caches. For cold-cache measurements (Linux), add `--prepare 'sync; echo 3 | sudo tee /proc/sys/vm/drop_caches'`.
2. Measure startup separately, because JVM and Node startup can dominate short workloads: run both commands with an empty workload (or `--version`) through hyperfine. Report startup and workload results side by side.
3. For JVM targets where steady-state throughput matters more than process time, use JMH (`org.openjdk.jmh`, Gradle plugin `me.champeau.jmh`) for the hot function instead of process timing, and say which one the report uses.
4. Read the output:
   - `Time (mean ± σ)`: mean wall-clock and standard deviation over runs.
   - `Range (min … max)` and the run count.
   - The `Summary` line: "`target` ran X ± Y times faster than `source`" (or slower).
   - Warnings: "Statistical outliers were detected" means interference; rerun on a quieter machine before drawing conclusions. "Command took less than 5 ms" means shell spawning noise matters; use `-N` (no intermediate shell) with a hyperfine version that supports it, or a larger workload.
5. For a significance check between the two runs, the hyperfine repository ships `scripts/welch_ttest.py` that reads the exported JSON; check it exists in your hyperfine version's repository before using it.

### Output
Exported JSON and Markdown per workload.

### Quality Gate
- Each exported JSON parses (`jq '.results[].mean' perf-<workload>.json` prints two numbers).
- The report quotes the Summary line verbatim.
- Any outlier warning was followed by a rerun, recorded in the report.

---

## Phase 3: Verdict and Next Step

### Entry Criteria
- Measurements complete.

### Actions
1. If `perf_budget` is given, apply it literally to the measured means (and the user's rule for variance if they gave one). If it is not given, the verdict is "no budget given" and the report lists the numbers only.
2. If the verdict is fail, name the profiler for the target:

| Target | Profile command | Read |
|---|---|---|
| Go | `go test -run=^$ -bench=. -cpuprofile cpu.out ./pkg/...` then `go tool pprof -top cpu.out` | `flat` and `cum` columns; top entries are the hot functions |
| Rust | `cargo flamegraph --bin app -- <args>` (cargo-flamegraph; uses perf on Linux) | widest frames in `flamegraph.svg` |
| Node / TS | `node --cpu-prof dist/cli.js <args>` writes a `.cpuprofile`; open it in Chrome DevTools Performance panel | self time per function |
| Kotlin / JVM | `java -XX:StartFlightRecording=filename=rec.jfr,settings=profile -jar app.jar <args>` then `jfr print --events jdk.ExecutionSample rec.jfr` or open in JDK Mission Control | most frequent top frames |
| Python (source baseline) | `py-spy record -o profile.svg -- python -m <pkg> <args>` | to compare where the source spent time |

3. Common port-specific causes to check first: Go string concatenation in loops (use `strings.Builder`), `[]rune(s)` conversions repeated per call, Rust `.clone()` in hot loops or `String` building with `+`, Kotlin collection chains creating intermediate lists (use `asSequence()` where laziness helps), TypeScript `bigint` in hot paths, regex recompiled per call in any target.
4. Any performance fix goes back through `port-module-port-loop` (golden replay must still pass).

### Output
`perf_report`.

### Quality Gate
- The verdict follows `perf_budget` literally or says "no budget given".
- A fail verdict names one profiler command from the table for the target.

---

## Worked Example

Illustrative. `stack=py-go`, workload = golden inputs replayed through a driver (312 calls) and a user-provided 50 MB ledger file. `perf_budget`: "target mean at most the source mean".
```
$ hyperfine --warmup 3 --export-json perf-ledger.json -n source 'python -m ledger report big.ledger' -n target './bin/ledger report big.ledger'
Benchmark 1: source
  Time (mean ± σ):      4.212 s ±  0.031 s    [User: 4.101 s, System: 0.104 s]
  Range (min … max):    4.170 s …  4.268 s    10 runs
Benchmark 2: target
  Time (mean ± σ):     612.4 ms ±   9.8 ms    [User: 590.2 ms, System: 30.1 ms]
  Range (min … max):   601.0 ms … 633.5 ms    10 runs
Summary
  target ran
    6.88 ± 0.12 times faster than source
```
Startup (`--version`): source 38.1 ms ± 1.2 ms, target 1.9 ms ± 0.3 ms. Verdict: pass (612.4 ms is at most 4.212 s).

---

## Exit Criteria

DONE when both sides were built in production mode, produce identical output on each workload, were measured with hyperfine with exported results and quoted summaries, and a verdict follows the user's budget or states that none was given.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parity verdict is not `PARITY` | **Stop**: comparing speed of a port that computes different results is meaningless. |
| Phase 1 | Outputs differ on the workload | **Return**: to `port-parity-diff-triage`; the corpus missed a case, add it as `golden-v2`. |
| Phase 2 | Large standard deviation or outlier warnings | **Retry**: on an idle machine, with more `--warmup`; record both runs. |
| Phase 3 | No budget and the user asks "is it fast enough" | **Return**: ask for the budget; do not supply one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
