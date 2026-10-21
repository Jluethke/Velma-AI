# Nondeterminism Source Inventory

**One-line description:** Sweeps an entire decision codebase with ripgrep for every known nondeterminism source (wall and monotonic clocks, random number generators, thread and task scheduling, hash iteration order, floating point mode, directory and I/O ordering, environment reads), then classifies each hit by category and by whether it can reach the decision output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root that contains the decision software.
- `decision_entrypoint` (string, required): The function, class or binary that turns inputs into a decision (for example `planner/decide.py:decide_step` or `src/arbiter.cpp:Arbiter::step`).
- `stack` (string, required): One of `python`, `cpp`, `go`, `rust`. Selects the pattern set in Phase 1.

---

## Outputs

- `nondeterminism_sources` (object[]): One row per hit: `file`, `line`, `snippet`, `category` (clock, rng, scheduling, hash_order, float, io_order, environment, identity), `reaches_decision` (yes, no, unknown), and `fix_class` from the table in Phase 3.

---

## Phase 1: Sweep the Whole Tree

### Entry Criteria
- `repo_path` exists and `rg --version` prints a version (install ripgrep if not).
- `stack` is one of the four supported values.

### Actions
1. Change into `repo_path`. Run `git status --porcelain` and record whether the tree is dirty; record `git rev-parse HEAD`.
2. Run the pattern set for `stack` over the WHOLE repository. Do not add `--glob` filters, do not skip `tests/`, `vendor/` or `third_party/`. A path filter hides real sites; classification happens in Phase 2, not here.
3. Pattern sets (run each as `rg -n --no-heading -e '<pattern>' .` and save output to a file outside the repo, for example `/tmp/detd_sweep.txt`):

| stack | category | patterns |
|---|---|---|
| python | clock | `time\.time\(`, `time\.monotonic`, `time\.perf_counter`, `datetime\.(now|utcnow|today)\(` |
| python | rng | `import random`, `random\.`, `np\.random\.`, `uuid\.uuid[14]\(`, `os\.urandom`, `secrets\.` |
| python | scheduling | `threading\.`, `concurrent\.futures`, `asyncio\.(gather|wait|as_completed)`, `multiprocessing` |
| python | hash_order | `set\(`, `frozenset\(`, `\{[^:}]+\}` set literals, `hash\(` |
| python | io_order | `os\.listdir`, `os\.scandir`, `glob\.glob`, `Path\([^)]*\)\.(iterdir|glob|rglob)` |
| python | environment | `os\.environ`, `os\.getenv`, `platform\.`, `socket\.gethostname` |
| cpp | clock | `system_clock::now`, `steady_clock::now`, `high_resolution_clock::now`, `clock_gettime`, `gettimeofday`, `\btime\(` |
| cpp | rng | `\brand\(`, `srand`, `random_device`, `mt19937`, `_distribution<` |
| cpp | scheduling | `std::thread`, `std::async`, `std::execution::par`, `#pragma omp`, `tbb::` |
| cpp | hash_order | `unordered_map`, `unordered_set`, `std::map<[^,]*\*`, `std::set<[^>]*\*` (pointer keys order by address, which changes with ASLR) |
| cpp | float | `-ffast-math`, `-Ofast`, `fesetround`, `_MM_SET_FLUSH_ZERO_MODE`, `/fp:fast` (also sweep `CMakeLists.txt` and `*.cmake`) |
| cpp | io_order | `readdir`, `directory_iterator`, `recursive_directory_iterator` |
| cpp | environment | `getenv`, `uname`, `gethostname` |
| go | clock | `time\.Now\(`, `time\.Since\(`, `time\.Until\(`, `time\.After\(`, `time\.NewTicker` |
| go | rng | `math/rand`, `crypto/rand`, `uuid\.New` |
| go | scheduling | `go func`, `\bgo [a-zA-Z_]+\(`, `select \{`, `sync\.WaitGroup` |
| go | hash_order | `range [a-zA-Z_.]+\s*\{` then confirm the ranged value is a map |
| go | io_order | `\.Readdir\(`, `\.ReadDir\(` called on an `*os.File` (unsorted; the package function `os.ReadDir` returns sorted entries) |
| rust | clock | `Instant::now`, `SystemTime::now`, `chrono::Utc::now`, `chrono::Local::now` |
| rust | rng | `thread_rng`, `rand::rng\(`, `rand::random`, `OsRng`, `StdRng` |
| rust | scheduling | `thread::spawn`, `tokio::spawn`, `rayon`, `par_iter` |
| rust | hash_order | `HashMap`, `HashSet` (default `RandomState` seeds per process) |
| rust | io_order | `read_dir` (order is platform dependent per std docs) |
| rust | environment | `std::env::var`, `env!` |

4. Count hits per category with `rg -c` and record the totals. A total of zero for a category the code obviously uses (for example `clock` in a control loop) means the pattern is wrong: fix the pattern, do not accept zero.

### Output
Raw hit list with category totals and the commit SHA swept.

### Quality Gate
- The sweep command lines are recorded exactly as run, with no `--glob`, `-g` or path arguments other than `.`.
- Mutation check: add one line `time.time()` (or the stack equivalent) to a scratch copy of one file outside the repo, rerun the clock pattern on that copy, and confirm the hit count increases by exactly 1. Delete the scratch copy.

---

## Phase 2: Classify Reachability

### Entry Criteria
- Phase 1 hit list exists.

### Actions
1. For each hit, decide `reaches_decision` with this rule table:

| Condition | reaches_decision |
|---|---|
| Hit is inside `decision_entrypoint` or a function it calls (follow with your IDE "find callers" or `rg -n '<function_name>\('`) | yes |
| Hit is in a module imported by the entrypoint module, and the call path is not traced | unknown |
| Hit is only in test code, build scripts or developer tooling that never ships | no |
| Hit computes a value that is logged only and never read back | no, but note it (logs feed field corpora) |

2. Treat `unknown` as `yes` for every later flow. Never downgrade `unknown` to `no` without a traced call path written in the row.
3. Hits under `vendor/` or `third_party/` that reach the decision stay in the list; mark them `vendor=true`.

### Output
Every hit carries `reaches_decision`.

### Quality Gate
- No row has an empty `reaches_decision`.
- Every `no` row cites the reason from the table.

---

## Phase 3: Assign Fix Class

### Entry Criteria
- Reachability classified.

### Actions
1. Assign `fix_class` from this table:

| category | fix_class |
|---|---|
| clock | inject_clock: read the clock once per tick at the boundary, pass `now` in |
| rng | inject_rng: one seeded generator of a named algorithm, passed in, seed recorded |
| scheduling | serialize_core: single-threaded decision step, inputs ordered by an explicit key before the step |
| hash_order | sort_before_iterate or ordered container |
| float | pin_float_mode: compiler flags and library policy, see the float flows |
| io_order | sort_listing |
| environment | read_once_and_record: read at startup, store in the recording header |
| identity | inject_id_factory: ids come from a counter or the seeded RNG |

2. Write `nondeterminism_sources` as JSON, sorted by `reaches_decision` (yes, unknown, no) then file then line.

### Output
`nondeterminism_sources`.

### Quality Gate
- Every row has a `fix_class` from the table, no free text.
- The JSON parses: `python -m json.tool sources.json > /dev/null` exits 0.

---

## Worked Example

Illustrative only. `stack=python`, `decision_entrypoint=planner/decide.py:decide_step`.

Phase 1: `rg -n --no-heading -e 'time\.time\(' -e 'datetime\.(now|utcnow|today)\(' .` returns 4 hits, including `planner/limits.py:58: stamp = time.time()`. `rg -n -e 'set\(' .` returns 11 hits.

Phase 2: `planner/limits.py:58` is called from `decide_step` through `check_limits()`, so `reaches_decision=yes`. `tools/plot_run.py:12` is developer tooling, so `no`.

Phase 3: row `{"file":"planner/limits.py","line":58,"category":"clock","reaches_decision":"yes","fix_class":"inject_clock"}`.

---

## Exit Criteria

DONE when every sweep hit is classified with category, reachability and fix class, and the mutation check proved the sweep catches a planted site.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Stop**: install ripgrep from the distribution package manager; do not fall back to a partial `grep` sweep without recording it. |
| Phase 1 | A category returns zero hits in code that clearly uses it | **Adjust**: fix the regex and rerun; never report zero without the mutation check passing. |
| Phase 2 | Call path cannot be traced | **Adjust**: mark `unknown`, treat as `yes`. |
| Phase 3 | Hit fits no category | **Return**: add it with category `environment` and a note; do not drop it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
