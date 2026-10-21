# PR Concurrency Pass

**One-line description:** Finds every piece of state the changed code shares across threads, goroutines, async tasks, processes or concurrent requests, then checks it against stack-specific race patterns (check-then-act, read-modify-write, lock ordering, lock held across I/O, unawaited async work, loop variable capture) and requires a database-level or lock-level guarantee for each shared write.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diff_file` (string, required): Saved PR diff.
- `reading_plan` (object[], required): Ordered files from `prr-diff-reading-order`.
- `stack` (string, required): `python`, `typescript`, `javascript`, `go`, or `java`.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `concurrency_findings` (object[]): Race, deadlock and async findings, written to `<findings_dir>/prr-concurrency-pass.json`.

---

## Phase 1: Inventory Shared State

### Entry Criteria
- `reading_plan` exists.

### Actions
1. List every variable or resource the changed code writes that another concurrent execution could also read or write:
   - module-level or global variables, class attributes, singletons, `static` fields;
   - in-process caches and maps;
   - database rows and tables (concurrent requests are concurrent writers even in single-threaded servers);
   - files, external APIs with side effects, message queues.
2. For each, name what runs concurrently: multiple web workers or requests, a thread pool, goroutines, `asyncio` tasks, Node promises interleaving at `await` points, scheduled jobs, retried messages.
3. Search added lines for concurrency primitives so none is missed:
   `git diff -U0 origin/<base>...<head> | grep -nE '^\+.*(threading|Lock\(|asyncio|create_task|gather|go func|sync\.|chan |select \{|Promise\.all|await |setTimeout|synchronized|Executor|CompletableFuture|@Async|SELECT .* FOR UPDATE|ON CONFLICT|transaction)'`

### Output
Shared-state table: state, writers, what runs concurrently.

### Quality Gate
- Every write to non-local state in changed functions is in the table.
- The grep output is recorded (or "none").

---

## Phase 2: Apply the Race Pattern Checklist

### Entry Criteria
- Phase 1 table exists.

### Actions
1. For each shared-state row, check the general patterns:

| Pattern | Looks like | Safe alternative |
|---|---|---|
| Check-then-act | `if not exists(x): create(x)`; `if balance >= amt: balance -= amt` in two statements | Unique constraint plus `INSERT ... ON CONFLICT`; single conditional `UPDATE ... WHERE balance >= amt` and check affected rows |
| Read-modify-write | Read a value, compute, write it back (`count = get(); set(count + 1)`) | Atomic `UPDATE t SET n = n + 1`; `SELECT ... FOR UPDATE` in a transaction; atomic types |
| Lock ordering | Two locks taken in different orders on different paths | One global order, documented |
| Lock held across I/O | Network or disk call inside a critical section | Copy data out, release, then do I/O |
| Non-idempotent retry | Job, webhook or message handler that charges, emails or inserts without a dedupe key | Idempotency key with a unique constraint |
| Double-checked initialization | Lazy init with a check outside the lock | Language's once primitive |

2. Then apply the row set for `stack`:

| `stack` | Check | Defect |
|---|---|---|
| python | Blocking call in `async def` (`time.sleep`, `requests.`, sync DB driver) | Stalls all tasks |
| python | `asyncio.create_task(...)` whose result is not stored | The Python docs warn the task may be garbage collected before it finishes; keep a reference |
| python | Coroutine called without `await` | Never runs; Python emits "coroutine ... was never awaited" |
| python | Shared mutable object in a thread pool without a `Lock` | Lost updates (the GIL does not make compound operations atomic) |
| typescript, javascript | Promise not awaited, returned, or `.catch`-handled | Unhandled rejection, work silently lost |
| typescript, javascript | `array.forEach(async ...)` | Callbacks not awaited; function returns before work completes; use `for ... of` with `await` or `Promise.all` |
| typescript, javascript | State read before an `await` and written after it | Another request interleaved at the `await` |
| go | Map written from more than one goroutine without a mutex | Runtime fatal error "concurrent map writes" |
| go | `wg.Add` called inside the goroutine it counts | `Wait` may return early |
| go | Loop variable captured by a goroutine closure | Per-iteration variables only since Go 1.22; check the `go` line in `go.mod` |
| go | Send on a channel nobody receives after cancellation | Goroutine leak; select on `ctx.Done()` |
| go | Struct containing `sync.Mutex` passed by value | Copy of the lock protects nothing; `go vet` copylocks |
| java | Compound operation on `ConcurrentHashMap` (`get` then `put`) | Lost update; use `compute`/`merge`/`putIfAbsent` |
| java | `SimpleDateFormat` or other non-thread-safe object shared as a field | Corrupted output; use `DateTimeFormatter` |
| java | Double-checked locking without `volatile` | Partially constructed object visible |

3. If the TypeScript static flow recorded "promise rules not enabled", check every changed `async` call site by hand for an `await`, `return`, or `.catch`.
4. For each suspect, write the interleaving: "Request A reads stock=1, request B reads stock=1, both decrement, stock=-1".

### Output
Suspect list with interleavings.

### Quality Gate
- Every shared-state row has the general patterns and the stack rows answered.
- Every suspect has a written interleaving of two concrete executions.

---

## Phase 3: Record Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. Label:

| Suspect | Label |
|---|---|
| Interleaving produces wrong data, double side effect, crash or deadlock on a production path | blocking |
| Unawaited promise or coroutine | blocking |
| Race only in test code or one-off scripts | nit |
| Depends on a deployment fact you cannot see (number of workers, single consumer) | question: ask the author to state it |

2. Where possible, point to a way to confirm it: Go `go test -race` (the race detector flow); Python and Java have no equivalent built-in detector, and a test that passes many times proves nothing, so suggest a test that forces the interleaving with two threads and a barrier (`threading.Barrier`, `java.util.concurrent.CyclicBarrier`), or two database sessions in separate transactions.
3. Write `<findings_dir>/prr-concurrency-pass.json` (fields `flow`, `category`="concurrency", `file`, `line`, `evidence` = the interleaving, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`concurrency_findings`.

### Quality Gate
- Every blocking finding has an interleaving and a named safe alternative.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. `stack=python`. Diff in a Django view:
```
+    coupon = Coupon.objects.get(code=code)
+    if coupon.uses < coupon.max_uses:
+        coupon.uses += 1
+        coupon.save()
+        apply_discount(order, coupon)
```
- Phase 1: shared state is the `coupon` row; concurrent requests are the writers.
- Phase 2: check-then-act plus read-modify-write. Interleaving: A and B both read `uses=4` with `max_uses=5`, both pass the check, both save `uses=5`: the coupon is used six times.
- Phase 3: blocking, fix: `updated = Coupon.objects.filter(code=code, uses__lt=F("max_uses")).update(uses=F("uses") + 1)`; apply the discount only if `updated == 1`.

---

## Exit Criteria

DONE when every shared write in the changed code is inventoried, checked against general and stack-specific race patterns with written interleavings, and recorded with a concrete safe alternative.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Concurrency model unknown (how many workers, which server) | **Adjust**: assume multiple concurrent requests; add a question. |
| Phase 2 | `stack` not in the table | **Adjust**: apply the general patterns only and note it. |
| Phase 3 | Author says "it never happens in practice" | **Return**: keep the finding unless they cite a mechanism (unique constraint, single consumer config) that prevents it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
