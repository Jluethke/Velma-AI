# Jest and Vitest Worker Tuning

**One-line description:** Picks the worker count and isolation mode for a Jest suite (`--maxWorkers`, `workerIdleMemoryLimit`, `--runInBand` only for diagnosis) or a Vitest suite (`--pool forks|threads|vmThreads`, `--maxWorkers`, `isolate`, `fileParallelism`) from measured runs, and makes shared resources worker-safe with `JEST_WORKER_ID` or `VITEST_POOL_ID`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Baseline Jest or Vitest command.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; sleep, network and database items should be `done`.

---

## Outputs

- `node_parallel_command` (object): Runner and version, chosen command and config keys, hyperfine results for every candidate, worker-safety commits, memory observations, and files that must run in a separate serial project.

---

## Phase 1: Record Defaults and Find Worker Conflicts

### Entry Criteria
- Runner version known (`npx jest --version` or `npx vitest --version`).

### Actions
1. Record defaults from the docs for the installed version: Jest runs files in parallel with `maxWorkers` defaulting to the number of available cores minus one (in watch mode, half the cores). Vitest's default pool is `forks` in Vitest 2 and later (`threads` in Vitest 1). Vitest worker options moved between majors (`poolOptions.threads.maxThreads` in older versions, top-level `maxWorkers` in newer ones); open the config reference for your exact major before writing a key.
2. Run once with the default worker count and once with `npx jest --runInBand` (or `npx vitest run --no-file-parallelism`). If the parallel run fails and the serial run passes, there is a worker conflict:

| Symptom | Fix |
|---|---|
| DB unique violations or wrong row counts | Per-worker database from `process.env.JEST_WORKER_ID` / `process.env.VITEST_POOL_ID` (see `tsp-node-db-transaction-rollback`) |
| `EADDRINUSE` | Listen on port `0` and read `server.address().port` |
| Shared temp files | `fs.mkdtempSync(path.join(os.tmpdir(), 'x-'))` per file |
| Snapshot or cache file write races | Write only inside per-test temp dirs |

3. Fix one conflict per commit; rerun the default parallel run after each.
4. Do NOT set `--runInBand` permanently to hide a conflict.

### Output
Green default parallel run.

### Quality Gate
- Default parallel run reports zero failed tests.
- Each fix commit touches one setup file or one test file.

---

## Phase 2: Measure Candidates

### Entry Criteria
- Default parallel run green.

### Actions
1. Candidate set for Jest: `--maxWorkers=<cores>`, `--maxWorkers=<cores minus 1>`, `--maxWorkers=50%`, and the CI runner's core count. For Vitest: the same counts through the worker flag your version documents, crossed with `--pool=forks` and `--pool=threads`.
2. Vitest isolation: `isolate: true` (default) re-evaluates modules per file. `--no-isolate` (or `isolate: false`) reuses the module graph across files in a worker and can be much faster, but any test that mutates module state, globals or mocks without restoring will leak. Measure it as a candidate only if Phase 3 shuffle checks will run.
3. Time with hyperfine: `hyperfine --runs <runs used in baseline_report> --export-json workers.json 'npx jest --maxWorkers=4' 'npx jest --maxWorkers=7' ...`.
4. Watch memory for Jest: run the best candidate with `--logHeapUsage`; if heap per file climbs steadily across files in one worker, set `workerIdleMemoryLimit` (Jest 29+, documented to restart workers after a test file when exceeded) to a value chosen from the observed heap numbers, and record the observed numbers next to it.
5. Pick the lowest median whose max is below every other candidate's max; if ranges overlap, choose fewer workers and record that results were not separable.

### Output
Chosen command and evidence.

### Quality Gate
- `workers.json` has all candidates; the chosen one's median and max are quoted.
- Any `workerIdleMemoryLimit` value is next to the heap readings that justify it.

---

## Phase 3: Lock In and Separate the Serial Remainder

### Entry Criteria
- Command chosen.

### Actions
1. Files that cannot share the machine (one external device or a fixed global resource): Jest `projects` with a second project for those files, run as a separate step with `--runInBand --selectProjects serial`; Vitest a separate config or workspace project run with `--no-file-parallelism`. Record each file and its resource.
2. Write the chosen flags to config (`maxWorkers` in `jest.config.*`, pool and worker keys in `vitest.config.*`) only after the user agrees; keep `test_command` unchanged otherwise and record the command line form.
3. Run with coverage using the chosen command and compare covered lines to `coverage_baseline` from `tsp-baseline-lock`; they must match when no tests changed.

### Output
`node_parallel_command`.

### Quality Gate
- Coverage covered lines equal the serial covered lines at the same commit.
- Every serial file names its shared resource.

---

## Worked Example

Illustrative. Jest 29.7, 8 cores locally, CI runner 4 cores, default run 1m41s.

- Phase 1: default run fails 3 tests in `src/search/*.test.ts` with `EADDRINUSE :::9200` (fake search server on a fixed port); fixed with port `0`. Green.
- Phase 2: hyperfine medians: `--maxWorkers=7` 58.2 s, `--maxWorkers=8` 57.9 s, `--maxWorkers=4` 79.0 s; 7 and 8 overlap, so choose 7. `--logHeapUsage` climbs from 180 MB to 1.9 GB in one worker; `workerIdleMemoryLimit: '1GB'` brings the run to 54.0 s.
- Phase 3: no serial files. Coverage `total.lines.covered` 18,402 before and after.

---

## Exit Criteria

DONE when a green worker configuration is chosen from recorded timings, worker conflicts are fixed one per commit, coverage matches serial, and serial exceptions name their resource.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Jest reports `A worker process has failed to exit gracefully` | **Adjust**: run `--detectOpenHandles` on the failing file to find the open handle (server, timer, DB pool) and close it in `afterAll`. |
| Phase 2 | `--no-isolate` candidate fails | **Adjust**: drop it from candidates unless the user wants to fix leaking state first. |
| Phase 2 | Parallel slower than `--runInBand` | **Return**: per-file setup dominates; run `tsp-node-transform-setup-cost` first. |
| Phase 3 | CI memory errors (`JavaScript heap out of memory`) | **Adjust**: lower workers for CI or set `workerIdleMemoryLimit`; record CI runner memory. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
