# Concurrency Symptom Triage

**One-line description:** Maps a reported concurrency symptom (wrong value, hang, crash message, duplicate side effect, database serialization error) to one named failure class using a fixed decision table, and lists the source paths that touch the failing operation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `symptom` (string, required): The observed behavior in the reporter's words, plus any exact error text, exit code or log line.
- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `concurrency_model` (string, required): One of `threads`, `asyncio`, `event-loop`, `goroutines`, `processes`, `none-known`. For Python it decides between the threading flows and the asyncio flows.
- `repo_path` (string, required): Absolute path to the repository root.
- `target_test` (string, required): The test name or command that shows the symptom, or `none` when no test reproduces it yet.

---

## Outputs

- `failure_class` (string): Exactly one of `data-race`, `lost-update`, `deadlock`, `livelock`, `goroutine-or-thread-leak`, `missing-await`, `blocking-in-event-loop`, `cancellation-bug`, `unhandled-rejection`, `async-interleaving`, `db-isolation-anomaly`, `db-deadlock`, `duplicate-side-effect`, `test-shared-state`, `unclassified`.
- `suspect_paths` (object[]): Each row is file path, line range, and the reason it is suspected (named shared variable, spawn site, lock, transaction, or retried call).

---

## Phase 1: Capture the Exact Evidence

### Entry Criteria
- `symptom`, `stack` and `repo_path` are present.
- `repo_path` exists and is a git work tree (`git -C "<repo_path>" rev-parse --is-inside-work-tree` prints `true`).

### Actions
1. Copy every exact error string, exit code and stack frame from `symptom` into an evidence list. Do not paraphrase error text; the decision table matches on literal strings.
2. If `target_test` is not `none`, run it once with the stack's plain test command and save the full output to a file outside the repository:
   - go: `go test -run '^<TestName>$' -count=1 -v ./<pkg> > /tmp/triage_run.txt 2>&1`
   - python: `python -m pytest "<nodeid>" -x -q > /tmp/triage_run.txt 2>&1`
   - java (Maven): `mvn -q test -Dtest=<Class>#<method> > /tmp/triage_run.txt 2>&1`; (Gradle): `./gradlew test --tests '<Class>.<method>' > /tmp/triage_run.txt 2>&1`
   - node: `npx jest -t "<name>" <file> > /tmp/triage_run.txt 2>&1` or `node --test <file> > /tmp/triage_run.txt 2>&1`
   - rust: `cargo test <name> -- --nocapture > /tmp/triage_run.txt 2>&1`
   - cpp: `ctest -R '<name>' --output-on-failure > /tmp/triage_run.txt 2>&1`
3. Record the exit code (`echo $?` immediately after the command). One passing run proves nothing about a concurrency bug; record PASS or FAIL and move on.
4. Record the observed CPU usage during a hang, if the symptom is a hang: run `top -p <pid>` (Linux) or `ps -o pid,pcpu,stat -p <pid>` and note whether CPU is near zero or near one full core per spinning thread.

### Output
Evidence list with literal error strings, the run output file, its exit code and, for hangs, the CPU observation.

### Quality Gate
- Every error string in the evidence list is a verbatim copy (search for it in `/tmp/triage_run.txt` or the reporter's text with `grep -F`).
- The exit code of the reproduction run is written down, or `target_test` is `none`.

---

## Phase 2: Classify With the Decision Table

### Entry Criteria
- Evidence list exists.

### Actions
1. Walk the table top to bottom. Take the FIRST row whose trigger matches the evidence. Do not pick a row because it "seems likely".

| Trigger (literal text or observation) | `failure_class` |
|---|---|
| `WARNING: DATA RACE` (Go) or `WARNING: ThreadSanitizer: data race` | data-race |
| `fatal error: concurrent map writes` or `fatal error: concurrent map read and map write` (Go runtime) | data-race |
| `ConcurrentModificationException` (Java) or `RuntimeError: dictionary changed size during iteration` (Python) | data-race |
| `fatal error: all goroutines are asleep - deadlock!` | deadlock |
| `Found one Java-level deadlock` or `lock-order-inversion (potential deadlock)` | deadlock |
| SQLSTATE `40P01` (`deadlock detected`) or MySQL `ERROR 1213` | db-deadlock |
| SQLSTATE `40001` (`could not serialize access`) | db-isolation-anomaly |
| Process hangs, CPU near zero | deadlock |
| Process hangs, CPU high on one or more threads | livelock |
| `RuntimeWarning: coroutine '...' was never awaited` | missing-await |
| `Executing <Task ...> took N seconds` or event-loop latency spikes | blocking-in-event-loop |
| `Task was destroyed but it is pending!`, `CancelledError` escaping, shutdown hangs in asyncio | cancellation-bug |
| `UnhandledPromiseRejection`, `ERR_UNHANDLED_REJECTION`, or `PromiseRejectionHandledWarning` | unhandled-rejection |
| Node value wrong only under concurrent requests | async-interleaving |
| Goroutine or thread count grows without bound; `goleak` reports; `Jest did not exit one second after the test run has completed` | goroutine-or-thread-leak |
| Duplicate rows, double charge, email sent twice after retry or redelivery | duplicate-side-effect |
| Counter, balance or stock count lower than expected under load, no error | lost-update |
| Test passes alone, fails when the suite runs in parallel | test-shared-state |
| None of the above | unclassified |

2. For `lost-update`, check whether the value lives in a database. If yes, keep `lost-update` and note "database"; the database isolation flows handle it. If it is in process memory, keep `lost-update` and note "memory"; the detector flows handle it.
3. For `python`, cross-check `concurrency_model`: an asyncio class (`missing-await`, `blocking-in-event-loop`, `cancellation-bug`) with `concurrency_model` = `threads` is a contradiction. Re-read the evidence; if the warning text is present, set `concurrency_model` note to "mixed" in the evidence list.

### Output
One `failure_class` value with the table row that matched.

### Quality Gate
- `failure_class` is exactly one value from the Outputs list.
- The matching trigger text appears in the evidence list (verify with `grep -F`), or the class is `unclassified`, `lost-update`, `test-shared-state`, `duplicate-side-effect`, or a hang class backed by the CPU observation.

---

## Phase 3: List Suspect Paths

### Entry Criteria
- `failure_class` is set.

### Actions
1. Take every file and line from the stack frames in the evidence. Each becomes a `suspect_paths` row with reason "in failing stack".
2. Search for concurrency entry points in the files named by those frames, using ripgrep from `repo_path`:
   - go: `rg -n "go func|go [a-zA-Z_.]+\(|sync\.(Mutex|RWMutex|WaitGroup|Once)|chan " <files>`
   - python: `rg -n "threading\.|ThreadPoolExecutor|ProcessPoolExecutor|asyncio\.(create_task|gather|run|wait_for|to_thread)|async def" <files>`
   - java: `rg -n "synchronized|ReentrantLock|ExecutorService|CompletableFuture|new Thread|@Async|volatile" <files>`
   - node: `rg -n "await |Promise\.(all|race|allSettled|any)|setImmediate|process\.nextTick|worker_threads" <files>`
   - rust: `rg -n "thread::spawn|tokio::spawn|Mutex|RwLock|Atomic|unsafe|Arc<" <files>`
   - cpp: `rg -n "std::thread|std::async|pthread_|std::mutex|std::atomic|volatile" <files>`
3. For `db-*`, `lost-update` (database) and `duplicate-side-effect`, also search for the transaction and retry sites: `rg -n "BEGIN|begin\(|transaction|FOR UPDATE|retry|Retry|backoff" <files>`.
4. If there are no stack frames (for example a wrong value with no error), use `git -C "<repo_path>" log -S "<name of the wrong field>" --oneline` and `rg -n "<name of the wrong field>"` to find writers of the affected value. Each writer is a row with reason "writes affected value".
5. Do not open or edit any file for fixing in this flow. Triage only reads.

### Output
`suspect_paths` with a reason per row.

### Quality Gate
- Every row's file exists (`test -f "<repo_path>/<file>"` exits 0).
- Every stack frame from the evidence that points into the repository has a row.

---

## Worked Example

Illustrative only.

Input: `symptom` = "Inventory count drifts below the true stock under load test; no errors. Go service.", `stack` = `go`, `concurrency_model` = `goroutines`, `target_test` = `TestReserveConcurrent`.

Phase 1: `go test -run '^TestReserveConcurrent$' -count=1 -v ./inventory > /tmp/triage_run.txt 2>&1; echo $?` prints `1`. The file contains `inventory_test.go:41: stock = 93, want 90`. No crash string.

Phase 2: no literal crash trigger; the value is lower than expected under load with no error and lives in a Go map in memory, so `failure_class` = `lost-update` (memory).

Phase 3: `rg -n "go func|sync\.Mutex" inventory/` finds `inventory/store.go:22: mu sync.Mutex` and `inventory/reserve.go:37: go func(id string)`. `rg -n "stock\[" inventory/` finds writers at `reserve.go:51` and `restock.go:18`. `suspect_paths` = three rows with reasons "spawn site", "writes affected value", "writes affected value".

---

## Exit Criteria

DONE when `failure_class` is a single value from the fixed list, justified by a literal trigger or recorded observation, and `suspect_paths` lists every in-repo stack frame and every writer of the affected value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `repo_path` is not a git work tree | **Stop**: ask for the correct path; later flows depend on `git diff` and `git stash`. |
| Phase 1 | `target_test` fails for a reason unrelated to concurrency (compile error, missing fixture) | **Return**: report the non-concurrency failure; it must be fixed before triage means anything. |
| Phase 2 | Two rows match | **Adjust**: take the first matching row in table order, as the table is ordered by evidence strength. |
| Phase 2 | No row matches | **Adjust**: set `unclassified` and continue; the stress harness flow will gather more evidence. |
| Phase 3 | Stack frames point only into third-party code | **Adjust**: walk up the frames to the first in-repo frame and list that call site. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
