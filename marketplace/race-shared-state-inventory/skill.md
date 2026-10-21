# Shared Mutable State Inventory

**One-line description:** Builds a table of every piece of mutable state reachable from more than one thread, goroutine, task or request in the suspect code, with its writers, readers and the guard that protects it, using stack-specific ripgrep searches.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `suspect_paths` (object[], required): Rows from `race-symptom-triage`; the search starts from these files and widens to their packages or modules.

---

## Outputs

- `shared_state_inventory` (object[]): One row per shared item: `name`, `location` (file:line of declaration), `kind` (global, static, singleton field, closure capture, class attribute, module variable, cache, map, connection or client object), `writers` (file:line list), `readers` (file:line list), `contexts` (which threads, goroutines, tasks or requests touch it), `guard` (the lock, atomic, channel or confinement rule, or `NONE`).

---

## Phase 1: Find Candidate State

### Entry Criteria
- `suspect_paths` has at least one row.
- `rg --version` prints a version (install ripgrep if not; do not substitute a hand-read of files).

### Actions
1. Set the search scope: the directories that contain the files in `suspect_paths`. Write the scope down as a list of directories.
2. Run the searches for `stack` from `repo_path`, each limited to the scope. Save each command's output.
   - go:
     - package-level variables: `rg -n "^var " --type go <dirs>`
     - goroutine launches and closures: `rg -n "go func\(" --type go <dirs>`
     - maps and slices held in structs: `rg -n "map\[[^]]+\]|\[\][A-Za-z*]" --type go <dirs>`
     - existing guards: `rg -n "sync\.(Mutex|RWMutex)|atomic\.|sync\.Map" --type go <dirs>`
   - python:
     - module-level mutable containers: `rg -n "^[A-Za-z_][A-Za-z0-9_]*\s*(:[^=]+)?=\s*(\{|\[|dict\(|list\(|set\(|defaultdict\(|collections\.)" --type py <dirs>`
     - `global` statements: `rg -n "^\s+global " --type py <dirs>`
     - mutable class attributes: `rg -n "^\s{4}[A-Za-z_][A-Za-z0-9_]*\s*(:[^=]+)?=\s*(\{|\[|dict\(|list\(|set\()" --type py <dirs>`
     - `functools.lru_cache` and `cache` decorators (thread-safe for the cache itself, not for mutable values they return): `rg -n "lru_cache|@cache" --type py <dirs>`
   - java:
     - non-final statics: `rg -n -P "\bstatic\b(?!.*\bfinal\b).*[=;]" --type java <dirs>`
     - final references to mutable containers: `rg -n "static final .*(Map|List|Set)<" --type java <dirs>`
     - fields of Spring singletons: `rg -n "@(Component|Service|Repository|Controller|RestController)" --type java <dirs>` then list each non-final field of those classes.
     - classes documented as not thread-safe: `rg -n "SimpleDateFormat|HashMap|ArrayList|StringBuilder|java\.util\.Random" --type java <dirs>`
   - cpp: `rg -n "^\s*static |^[A-Za-z_][A-Za-z0-9_:<>, ]*\s+g_[A-Za-z0-9_]+|thread_local|std::thread|std::async|pthread_create" <dirs>`
   - rust: `rg -n "static mut|unsafe impl (Send|Sync)|UnsafeCell|Ordering::Relaxed|lazy_static!|OnceLock|thread_local!" --type rust <dirs>`
   - node:
     - module-level `let` and `var`: `rg -n "^(let|var) " --type js --type ts <dirs>`
     - module-level object or Map used as cache: `rg -n "^(const|let) [A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(\{|new Map|new Set|\[)" --type js --type ts <dirs>`
3. For each hit, open only the hit line and its enclosing declaration to confirm it is mutable. Discard true constants (Go `const`, Java `static final` primitives or immutable types, Python names only ever rebound at import time).

### Output
Candidate list of mutable declarations with file:line.

### Quality Gate
- Each search command for `stack` was run and its output saved (one output per command, empty output allowed).
- Every discarded candidate has a written reason ("immutable type", "only set at import").

---

## Phase 2: Map Writers, Readers and Contexts

### Entry Criteria
- Candidate list exists.

### Actions
1. For each candidate, find every access: `rg -n -w "<name>" <dirs>`. Mark each hit as write (assignment, `+=`, `append`, `put`, `push`, `delete`, method that mutates) or read.
2. For each access, determine its execution context with this rule set:
   - inside a function passed to `go`, `threading.Thread(target=...)`, `executor.submit`, `std::thread`, `thread::spawn`, `tokio::spawn`, `asyncio.create_task`, `CompletableFuture.supplyAsync`: that spawned context.
   - inside an HTTP handler, message consumer, or scheduled job: "per request" (assume concurrent unless the framework documents one-at-a-time delivery).
   - in Node, any code after an `await` in a request handler: "per request, interleaves at await".
   - otherwise: the caller's context; follow one level up with `rg -n "<function name>\("`.
3. An item is shared when it has at least one write and accesses from two or more contexts, or from one "per request" context (which runs many times concurrently).

### Output
Per-candidate writer, reader and context lists, with a shared or not-shared mark.

### Quality Gate
- Every shared item has at least one write listed with file:line.
- Every context is named as one of the rule-set categories, never "probably safe".

---

## Phase 3: Record the Guard

### Entry Criteria
- Shared items are marked.

### Actions
1. For each write and read of a shared item, record what protects it:
   - a lock held at that line (`mu.Lock()` before and `Unlock` after in the same function, `synchronized`, `with lock:`, `std::lock_guard`, `.lock()` guard in scope),
   - an atomic type (`atomic.Int64`, `AtomicLong`, `std::atomic`, `AtomicU64`),
   - a channel or queue hand-off (the value is sent and the sender never touches it again),
   - confinement (only one goroutine or thread ever touches it, documented by comment or structure),
   - `NONE`.
2. If reads and writes use different guards, or some accesses are guarded and others are not, set `guard` to `INCONSISTENT: <details>`. This is the most common real race.
3. In Python, record the GIL as `NONE`. The GIL makes single bytecode steps atomic, not `x += 1`, `if k not in d: d[k] = v`, or any read-modify-write. On a free-threaded build (`python3.13t`, PEP 703) even fewer operations are serialized.
4. In Node, record single-threaded execution as a guard only for code with no `await` between the read and the write. A read, then `await`, then a write is `NONE`.
5. Emit `shared_state_inventory`.

### Output
`shared_state_inventory`.

### Quality Gate
- Every row has a non-empty `guard` field.
- Every row with `guard` = `NONE` or `INCONSISTENT` lists at least one write site.

---

## Worked Example

Illustrative only.

Input: `stack` = `python`, `suspect_paths` = `app/metrics.py:10-40`.

Phase 1: `rg -n "^[A-Za-z_][A-Za-z0-9_]*\s*(:[^=]+)?=\s*(\{|\[|dict\()" --type py app/` prints `app/metrics.py:8:_counts = {}` and `app/config.py:3:DEFAULTS = {"retries": 3}`. `DEFAULTS` is only read after import; discarded with reason "only set at import".

Phase 2: `rg -n -w "_counts" app/` finds a write at `metrics.py:21` (`_counts[k] = _counts.get(k, 0) + 1`) inside `record()`, called from `app/worker.py:55`, which runs inside `ThreadPoolExecutor.submit`. Reads at `metrics.py:33` in the `/metrics` HTTP handler. Contexts: worker threads and per request.

Phase 3: no lock around line 21. Row: `name` = `_counts`, `guard` = `NONE`, writers = `metrics.py:21`, readers = `metrics.py:33`.

---

## Exit Criteria

DONE when every mutable declaration in the scope is either discarded with a reason or present in `shared_state_inventory` with writers, readers, contexts and a guard value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Stop**: install ripgrep (`apt install ripgrep`, `brew install ripgrep`, `winget install BurntSushi.ripgrep.MSVC`); manual reading misses sites. |
| Phase 1 | Search returns thousands of hits | **Adjust**: narrow the scope to the directories in `suspect_paths` only; do not sample hits at random. |
| Phase 2 | A name is too generic to grep (`data`, `cache`) | **Adjust**: search for the qualified form (`self.cache`, `s.cache`, `this.cache`) or use the IDE "find references" output. |
| Phase 3 | Lock and access are in different functions | **Adjust**: follow callers with `rg -n "<function>\("` until the lock acquisition is found or the chain ends; record `NONE` if it ends without one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
