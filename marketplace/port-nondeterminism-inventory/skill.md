# Port Nondeterminism Inventory

**One-line description:** Finds every source of run-to-run variation in the source program (clock, randomness, hash and map ordering, directory listing order, locale, timezone, environment, addresses in output, thread scheduling) with grep patterns per language, and assigns each one a control strategy so golden outputs captured from the original are reproducible.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`). The first half names the source language.
- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`.

---

## Outputs

- `nondeterminism_sources` (object[]): One row per source: `id` (N-001 style), `category`, `location` (file:line), `behaviors` (B-ids it affects), `strategy` (inject, freeze, pin_env, sort, mask), and the exact mechanism (parameter name, tool, env var, or field path to mask).

---

## Phase 1: Grep for Known Sources

### Entry Criteria
- `behavior_inventory` exists and every row has `in_scope`.

### Actions
1. Run the grep set for the source language from the repo root. Save each command's output.

| Category | Python | JavaScript | Java | C |
|---|---|---|---|---|
| Wall clock | `rg -n "datetime\.(now|utcnow|today)|time\.time\(|date\.today"` | `rg -n "Date\.now|new Date\(\)|performance\.now"` | `rg -n "System\.currentTimeMillis|Instant\.now|LocalDate(Time)?\.now|new Date\(\)"` | `rg -n "\btime\(|clock_gettime|gettimeofday"` |
| Randomness | `rg -n "random\.|secrets\.|uuid\.uuid4|os\.urandom"` | `rg -n "Math\.random|crypto\.(randomUUID|getRandomValues|randomBytes)"` | `rg -n "new Random|ThreadLocalRandom|SecureRandom|UUID\.randomUUID|Math\.random"` | `rg -n "\brand\(|srand|random\(|getrandom|/dev/urandom"` |
| Hash or map order | `rg -n "\bset\(|frozenset|\{[^:}]+\}"` then check iteration of sets of `str` (order depends on `PYTHONHASHSEED`) | object keys that look like integers iterate first in ascending order, then string keys in insertion order: `rg -n "Object\.(keys|entries|values)|for \(const \w+ in "` | `rg -n "HashMap|HashSet|\.hashCode\(\)"` where the result is iterated | hash tables keyed by pointer address |
| Directory order | `rg -n "os\.listdir|os\.scandir|glob\.glob|Path\(.*\)\.(iterdir|glob)"` (order is arbitrary) | `rg -n "fs\.readdir"` (OS order) | `rg -n "File\(.*\)\.list|Files\.(list|walk|newDirectoryStream)"` (unspecified) | `rg -n "readdir\("` (arbitrary) |
| Locale and timezone | `rg -n "locale\.|strftime|astimezone|tzlocal"` | `rg -n "toLocale|Intl\.|getTimezoneOffset"` | `rg -n "Locale\.getDefault|TimeZone\.getDefault|ZoneId\.systemDefault|String\.format\("` | `rg -n "setlocale|localtime|strftime|printf\(.*%[0-9.]*[fgeE]"` (decimal separator follows `LC_NUMERIC`) |
| Environment | `rg -n "os\.environ|os\.getenv|getpass\.getuser|platform\."` | `rg -n "process\.(env|platform|arch|pid)|os\.(hostname|userInfo)"` | `rg -n "System\.(getenv|getProperty)"` | `rg -n "getenv\(|getpid\(|uname\("` |
| Addresses and ids in output | default `repr` prints `<Foo object at 0x...>`: `rg -n "def __repr__|id\("` and look for objects printed without `__repr__` | `rg -n "console\.log\(.*\bthis\b"` | default `Object.toString` prints `Foo@1b6d3586`: classes printed without `toString` override | `rg -n "%p"` |
| Concurrency order | `rg -n "threading|concurrent\.futures|multiprocessing|asyncio\.(gather|as_completed)"` | `rg -n "Promise\.(race|any|allSettled)|worker_threads|setImmediate"` | `rg -n "ExecutorService|parallelStream|CompletableFuture|Thread\("` | `rg -n "pthread_|#pragma omp"` |

2. For each hit, open the line and find which B-ids reach it (follow the call chain from the behavior's entry function). A hit no in-scope behavior reaches is recorded with `behaviors = []`.

### Output
Raw candidate list with location and affected behaviors.

### Quality Gate
- Every category in the table was searched; zero-hit categories are recorded as "searched, 0 hits" with the exact command.
- Every candidate has a file:line that exists.

---

## Phase 2: Assign a Control Strategy

### Entry Criteria
- Candidate list exists.

### Actions
1. Assign exactly one strategy per row with this decision table. Take the first row that matches.

| Condition | Strategy | Mechanism |
|---|---|---|
| Value is passed in from a function the port also exposes (a `now` or `rng` parameter exists or can be added without changing the public signature default) | inject | Name the parameter; the capture harness passes a fixed value |
| Python wall clock | freeze | `time-machine` (`time_machine.travel(...)`) or `freezegun` (`freeze_time(...)`) |
| JavaScript wall clock | freeze | `@sinonjs/fake-timers` (`FakeTimers.install({ now: ... })`) |
| Java wall clock | inject | Replace `Instant.now()` call sites with a `java.time.Clock` parameter and pass `Clock.fixed(...)`; the JDK cannot freeze the system clock |
| C wall clock | inject | Wrap `time()` behind a function pointer or link-time substitution (`-Wl,--wrap=time` with GNU ld) |
| Seeded PRNG (`random.seed`, `new Random(seed)`, `srand`) | inject | Fixed seed. Note the target language PRNG will produce a different sequence from the same seed; the output is masked or the port takes the random values as input |
| Unseeded randomness or UUIDs | mask | JSON path of the field, compared by shape (for example "is a UUID v4") instead of value |
| Hash or map iteration order that reaches output | sort | Sort at the comparison step and record the field as `unordered` in the corpus schema; never sort inside the source program |
| Python `str` set iteration | pin_env | `PYTHONHASHSEED=0` for capture, plus `unordered` in the schema, because the target cannot reproduce CPython hash order |
| Directory listing | sort | Sort in comparison, or record that the source sorts (Go `os.ReadDir` returns entries sorted by filename, so the Go port may differ from an unsorted Python `os.listdir`) |
| Locale or timezone | pin_env | `TZ=UTC`, `LC_ALL=C.UTF-8`; Java also `-Duser.timezone=UTC -Duser.language=en -Duser.country=US` |
| Address or identity hash in output | mask | Regex for the mask, for example `0x[0-9a-f]+` or `@[0-9a-f]+` |
| Concurrency completion order | sort | Mark the output field `unordered`, unless the source guarantees order (for example `asyncio.gather` returns results in argument order, and so does `Promise.all`) |

2. Write the chosen mechanism verbatim (parameter name, env var and value, mask regex, or JSON path).
3. For every `mask` row, write one sentence on why the value cannot be controlled. A mask hides behavior, so every mask must be justified.

### Output
`nondeterminism_sources`.

### Quality Gate
- Every row has exactly one strategy from the table.
- Every `mask` row has a written justification and a regex or JSON path.
- No row says "ignore" or "flaky"; those are not strategies.

---

## Phase 3: Prove Reproducibility on One Behavior

### Entry Criteria
- `nondeterminism_sources` complete.

### Actions
1. Pick the in-scope behavior with the most rows in `nondeterminism_sources`.
2. Run it twice with the pinned environment and freezes applied, writing output to two files, then compare: `diff run1.out run2.out` (or `cmp` for binary output).
3. Run it a third time with a different `PYTHONHASHSEED` (Python) or a different `TZ` value to confirm the pinning matters. A difference here shows the pin is doing work.

### Output
Reproducibility evidence attached to `nondeterminism_sources`.

### Quality Gate
- `diff run1.out run2.out` printed nothing (exit status 0).
- If run three differed from run one, the differing field is already covered by a row; if it is not, a row was added.

---

## Worked Example

Illustrative. `stack=py-go`, source is a report generator.

Phase 1 hits:
```
reports/build.py:31:    stamp = datetime.now(timezone.utc).isoformat()
reports/build.py:58:    for tag in set(tags):
reports/scan.py:12:     for name in os.listdir(root):
```
Phase 2 rows:
```
N-001 wall clock reports/build.py:31 B-002 inject  add parameter now: datetime | None = None
N-002 hash order reports/build.py:58 B-002 pin_env PYTHONHASHSEED=0; schema marks $.tags unordered
N-003 directory  reports/scan.py:12  B-003 sort    schema marks $.files unordered (Go os.ReadDir is sorted, Python is not)
```
Phase 3:
```
$ PYTHONHASHSEED=0 TZ=UTC python -m reports build fixtures/a > run1.out
$ PYTHONHASHSEED=0 TZ=UTC python -m reports build fixtures/a > run2.out
$ diff run1.out run2.out; echo $?
0
```

---

## Exit Criteria

DONE when every grep category was searched, every hit reachable from an in-scope behavior has one justified control strategy, and two pinned runs produce identical output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Adjust**: install ripgrep or use `grep -rnE` with the same pattern; do not skip categories. |
| Phase 2 | Injecting a parameter would change a public signature | **Adjust**: use freeze or pin_env instead; the source's public API is the contract being ported. |
| Phase 3 | Pinned runs still differ | **Retry**: `diff` the two outputs, find the varying field, add a row for its source, rerun. |
| Phase 3 | Variation comes from a third-party library internals | **Adjust**: mask the field with a justification naming the library and version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
