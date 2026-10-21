# Node.js Benchmark Harness with tinybench

**One-line description:** Writes a tinybench script for the slow JavaScript or TypeScript function at each workload size, defeats dead-code elimination with a result sink, runs it with warmup on a production build, and exports raw samples as JSON.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`.
- `workload_spec` (object, required): Sizes, inputs, warmup and repetition settings.
- `bench_env_report` (object, required): Pinned core and machine state.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_bench_raw` (object): Path to `perf/bench/node_baseline.json` with per-task samples, mean, p75, p99, standard deviation and relative margin of error, plus the command, Node version and tinybench version.

---

## Phase 1: Install and Check the Version

### Entry Criteria
- `node --version` exits 0. The target function is exported from a module.

### Actions
1. Install: `npm install --save-dev tinybench`. Record `npm ls tinybench` output.
2. Read the installed major version. The API changed across majors, so open `node_modules/tinybench/README.md` and confirm three things before writing code: the constructor option names (for example `time`, `iterations`, `warmupTime`, `warmupIterations`), whether warmup runs inside `bench.run()` or needs a separate `await bench.warmup()` call (version 2 needs the separate call), and the field names on `task.result` that hold the samples and percentiles.
3. Write the confirmed names into a comment at the top of the script. Do not use an option name that is not in the installed README.
4. If the target is TypeScript, benchmark the compiled JavaScript output (`npm run build` first, then import from `dist/`). Benchmarking through `ts-node` or `tsx` measures the transpiler too.

### Output
Confirmed API notes for the installed version.

### Quality Gate
- `npm ls tinybench` shows exactly one version.
- The script header lists the option and result field names with the README section they came from.

---

## Phase 2: Write the Benchmark

### Entry Criteria
- API names confirmed.

### Actions
1. Create one new file `bench/<target>.bench.mjs`. Do not edit existing source or test files.
2. Build inputs for every size in `workload_spec.sizes` before adding tasks.
3. Store each result in a module-level sink and check it after the run, so V8 cannot drop the call as unused:

```js
// tinybench 2.x: warmup is a separate call (README "Usage"); check yours.
import { Bench } from 'tinybench';
import { writeFileSync } from 'node:fs';
import { buildIndex } from '../dist/search/index.js';   // grep for the real export first
import { loadDocs } from './data.mjs';

const SIZES = [10_000, 40_000];                          // from workload_spec.sizes
let sink = 0;
const bench = new Bench({ time: Number(process.env.BENCH_TIME_MS) });   // value from workload_spec

for (const n of SIZES) {
  const docs = loadDocs(n);
  bench.add(`buildIndex n=${n}`, () => { sink += buildIndex(docs).size; });
}
await bench.warmup();      // remove if your version warms up inside run()
await bench.run();
if (sink === 0) throw new Error('sink is zero: benchmark did no work');
console.table(bench.table());
writeFileSync('perf/bench/node_baseline.json', JSON.stringify(
  bench.tasks.map(t => ({ name: t.name, result: t.result })), null, 2));
```

4. If the function is async, pass an async function to `bench.add`; tinybench awaits it.

### Output
`bench/<target>.bench.mjs`.

### Quality Gate
- The file contains a sink variable and a check that throws when it is zero.
- `node --check bench/<target>.bench.mjs` exits 0.

---

## Phase 3: Run and Record

### Entry Criteria
- Script passes the syntax check.

### Actions
1. Run on the pinned core with production settings:

```bash
NODE_ENV=production BENCH_TIME_MS=<from workload_spec> taskset -c <core> node bench/<target>.bench.mjs
```

2. Do not run with `--inspect`, a debugger attached, or coverage (`c8`, `nyc`); each changes JIT behavior.
3. Read `bench.table()`: the throughput column (ops/s), the average time column, the margin column (shown as `±x%`, the relative margin of error), and the samples count. Exact column names depend on the version.
4. Fill `node_bench_raw` with the JSON path, command, Node version, tinybench version, and per-task mean, p75, p99, standard deviation and sample count.

### Output
`node_bench_raw`.

### Quality Gate
- The run exits 0 and did not throw the sink error.
- `perf/bench/node_baseline.json` contains one entry per size with a non-empty samples array.

---

## Worked Example

Illustrative. Target `buildIndex` in `dist/search/index.js`, sizes 10,000 and 40,000 documents, tinybench 2.9.

- Phase 1: README confirms `time`, `warmupTime`, `bench.warmup()`, and `task.result.samples`, `mean`, `p75`, `p99`, `sd`, `rme`.
- Phase 2: script written as above; `node --check` exits 0.
- Phase 3: output

```
| Task Name           | ops/sec | Average Time (ns) | Margin  | Samples |
| buildIndex n=10000  | '41'    | 24311022.1        | '±0.84%'| 42      |
| buildIndex n=40000  | '3'     | 371904551.3       | '±1.12%'| 6       |
```

4x input gave about 15x time. The low sample count at n=40000 is recorded; the user raises `BENCH_TIME_MS` if more samples are needed.

---

## Exit Criteria

DONE when `perf/bench/node_baseline.json` holds samples for every size, the script uses a checked sink, the build measured is the production build, and the versions and command are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | README option names differ from the example | **Adjust**: use the README names; the example is for 2.x. |
| Phase 1 | Package is CommonJS only | **Adjust**: name the file `.cjs` and use `require`, or use dynamic `import()`. |
| Phase 2 | Function needs a running server | **Return**: to `perf-hyperfine-cli-harness` or a load test; tinybench is in-process only. |
| Phase 3 | Sink error thrown | **Stop**: the function returned nothing useful; fix the call, not the check. |
| Phase 3 | Margin of error varies a lot between two runs | **Return**: to `perf-bench-env-stabilize`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
