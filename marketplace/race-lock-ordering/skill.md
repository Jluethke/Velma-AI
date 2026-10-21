# Lock Ordering Specification

**One-line description:** Builds the lock acquisition graph for the code paths in the race sites, finds every cycle that can deadlock, and writes a lock order specification (a rank per lock, address or key order for same-class locks, no calls out while holding a lock) with stack-specific enforcement tools.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `race_sites` (object[], required): From `race-findings-consolidate`; rows of kind `lock-cycle` drive this flow, and rows of other kinds add the locks they touch.

---

## Outputs

- `lock_order_spec` (object): `locks` (name, declaration file:line, rank), `edges` (holder lock, acquired lock, file:line of the nested acquisition), `cycles` (each as a lock list with the edge sites), `rules` (the ordering rules to apply), `enforcement` (the tool or assertion that checks order on this stack), `empty_reason` (set when no path holds two locks).

---

## Phase 1: Build the Acquisition Graph

### Entry Criteria
- `race_sites` is present.

### Actions
1. List every lock in the files named by `race_sites` and their callers:
   - go: `rg -n "\.(Lock|RLock)\(\)" --type go`
   - java: `rg -n "synchronized\s*\(|synchronized [a-zA-Z<]|\.lock\(\)|\.lockInterruptibly\(\)|\.tryLock\(" --type java`
   - python: `rg -n "with [a-zA-Z_.]*(lock|_lock|mutex)\b|\.acquire\(" --type py`
   - cpp: `rg -n "lock_guard|unique_lock|scoped_lock|\.lock\(\)|pthread_mutex_lock"`
   - rust: `rg -n "\.lock\(\)|\.read\(\)|\.write\(\)" --type rust`
   - node: async mutexes `rg -n "runExclusive|acquire\(\)" ` plus database row locks `rg -n "FOR UPDATE"`.
   - Database row locks in any stack: `rg -n "FOR UPDATE|FOR SHARE|LOCK TABLE|pg_advisory"`.
2. For each function that acquires a lock, read forward to its release and note every other lock acquired before release, including locks acquired inside functions it calls (follow calls one level at a time with `rg -n "<callee>\("` until no further lock is found). Each nesting is an edge "held -> acquired".
3. Treat these as nested acquisitions too: calling a callback, listener, or overridable method while holding a lock (unknown code may lock), Java `synchronized` methods calling other `synchronized` methods on a different object, and `Condition.await` re-acquiring.
4. Add all `lock-cycle` rows from `race_sites` as edges with their dump evidence.

### Output
Lock list and edge list with file:line for each edge.

### Quality Gate
- Every edge has the file:line of the nested acquisition.
- Every `lock-cycle` row from `race_sites` appears as edges.

---

## Phase 2: Find Cycles and Assign Ranks

### Entry Criteria
- Edge list exists.

### Actions
1. Find cycles: a cycle exists when following edges from a lock returns to it. For small graphs list paths by hand; for larger ones write the edges as `A B` lines in a file and run `tsort edges.txt` (POSIX `tsort` prints `tsort: -: input contains a loop:` and the loop members when a cycle exists).
2. Same-class locks (two `Account` objects, two rows of one table) form a cycle whenever two code paths can take them in opposite argument order, even if the graph by name shows a single self-edge `Account.mu -> Account.mu`. Record every self-edge as a cycle.
3. Assign ranks: give each distinct lock class a number so that every edge goes from lower to higher rank. Where a cycle exists, choose which edge to reverse by changing the code path with the fewest call sites.
4. For same-class locks, the rule is a total order on instances: acquire in ascending order of a stable unique key (account id, primary key). Do not use memory addresses in managed languages (Java `System.identityHashCode` can collide; Python `id()` is stable but meaningless across processes). In C++ and Go, ordering by pointer address is acceptable within one process, but a business key is clearer.
5. Write rules, all that apply:
   - R1: acquire locks only in ascending rank.
   - R2: same-class locks in ascending key order; if keys are equal, take one lock.
   - R3: no I/O, RPC, callback or listener invocation while holding any lock; copy what is needed, release, then call out.
   - R4: database rows locked in ascending primary key order in one statement (`SELECT ... WHERE id IN (...) ORDER BY id FOR UPDATE`).
   - R5: where a path cannot respect the order, use try-lock with release and retry (`tryLock(timeout)` in Java, `std::try_lock` / `std::scoped_lock` for multiple mutexes in C++17, which uses a deadlock-avoidance algorithm).

### Output
Cycles, ranks and rules.

### Quality Gate
- Every cycle has a named edge to reverse or a rule (R2, R4, R5) that breaks it.
- `tsort` (or a hand-listed check) on the edge list with the proposed reversals applied reports no loop.

---

## Phase 3: Choose Enforcement for the Stack

### Entry Criteria
- Rules written.

### Actions
1. Pick the enforcement by `stack`:

| Stack | Enforcement |
|---|---|
| go | `github.com/sasha-s/go-deadlock` as a drop-in for `sync.Mutex` in test builds (build tag), which reports lock-order inversions; plus `-race` runs |
| cpp | TSan `lock-order-inversion` reports in the TSan build; `std::scoped_lock(a, b)` for multi-lock sites; Abseil `absl::Mutex` has a deadlock detector controlled by `absl::SetMutexDeadlockDetectionMode` if the project uses Abseil |
| rust | Avoid nested guards; `parking_lot` has an optional `deadlock_detection` feature (check its docs) for test builds |
| java | Integration test that calls `ThreadMXBean.findDeadlockedThreads()` after the stress run and fails if non-null; `ReentrantLock.tryLock(timeout, unit)` at sites that cannot respect order |
| python | No built-in checker: wrap locks in a small ranked-lock class in test builds that asserts the thread's currently held rank is lower than the one being acquired (thread-local list of held ranks) |
| node | Async mutexes: acquire in key order; database locks: rule R4 |

2. Do not add enforcement code to production paths in this flow; record what `race-apply-fix` must add and where.
3. If no function holds two locks and there are no `lock-cycle` rows, set `empty_reason` = "no nested acquisitions" and emit an empty spec.

### Output
`lock_order_spec`.

### Quality Gate
- `enforcement` names a tool or assertion from the table for `stack`.
- Either `cycles` is non-empty with a breaking rule each, or `empty_reason` is set.

---

## Worked Example

Illustrative only.

Input: `race_sites` row kind `lock-cycle` from `race-java-thread-dump`: `TransferService.java:27` (`synchronized (from)`) then `:28` (`synchronized (to)`).

Phase 1: edges `Account -> Account` at line 28 (self-edge), plus `Account -> AuditLog.lock` at `TransferService.java:31` (audit write inside the nested block).

Phase 2: self-edge is a cycle by R2. Rules: R2 (lock the account with the lower `id` first), R3 (move `audit.append` after both monitors are released). Ranks: Account = 1, AuditLog.lock = 2.

Phase 3: enforcement: stress test asserts `findDeadlockedThreads()` returns null after 10,000 transfers in random direction (count is the user's chosen `stress_runs`).

---

## Exit Criteria

DONE when every nested acquisition in the relevant code is an edge with a site, every cycle has a breaking rule, ranks give a loop-free order, and an enforcement method is named for the stack.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Locks are acquired through a framework (`@Transactional`, ORM row locks) | **Adjust**: treat each transaction's row locks as locks named by table and key, and apply R4. |
| Phase 2 | No stable key exists for same-class locks | **Adjust**: add a unique, immutable sequence number to the class at construction and order by it. |
| Phase 2 | A cycle cannot be broken without a redesign | **Return**: record the cycle and recommend R5 (try-lock with release and retry) as the interim rule. |
| Phase 3 | Enforcement tool not allowed as a dependency | **Adjust**: use the stress test plus thread dump assertion approach for the stack. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
