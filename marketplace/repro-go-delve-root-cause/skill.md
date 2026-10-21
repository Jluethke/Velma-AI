# Go Root Cause with Delve

**One-line description:** Runs the red Go test under Delve (`dlv test`), with optimizations disabled so variables are readable, and uses `break`, `condition`, `stack`, `frame`, `locals`, `goroutines` and `print` to find the origin of a panic, wrong value, race or deadlock.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `go_debug_trace` (object): Delve transcript, goroutine list when relevant, origin line, values proving the defect, and a one-sentence defect statement. Empty when `stack` is not go.

---

## Phase 1: Launch the Test in Delve

### Entry Criteria
- `regression_test` is red.
- `dlv version` prints a version (install: `go install github.com/go-delve/delve/cmd/dlv@latest`).

### Actions
1. From the package directory or with a package path, run: `dlv test ./<pkg> -- -test.run '^TestName$' -test.count=1 -test.v`. Arguments after `--` go to the test binary, which uses the `-test.` prefix.
2. `dlv test` builds with `-gcflags='all=-N -l'` (no optimization, no inlining) by default, so locals are visible. If you build a binary yourself for `dlv exec`, pass those gcflags explicitly or variables show as `(optimized away)`.
3. At the `(dlv)` prompt, set a breakpoint at the failure and continue:
   - Panic: Delve stops automatically on unrecovered panics (`runtime-fatal-throw` and `unrecovered-runtime-panic` breakpoints are set by default). Just `continue`.
   - Wrong value: `break <file>.go:<line>` on the assertion in the test, then `continue`.

### Output
Debugger stopped at the failure.

### Quality Gate
- Transcript shows `> [unrecovered-runtime-panic]` or `> main.TestName() ./<file>_test.go:<line>` as the stop location.

---

## Phase 2: Inspect the Failure Frame

### Entry Criteria
- Stopped at the failure.

### Actions
1. Run and paste:
   1. `stack` (or `bt`): frames numbered from 0.
   2. `frame <n> list`: source around frame n. Pick the first frame inside the module (skip `runtime.` frames).
   3. `frame <n> locals` and `frame <n> args`.
   4. `frame <n> print <expr>` for each value on the failing line. Maps and slices print with lengths; `print m == nil` checks for nil maps directly.
2. For goroutine bugs: `goroutines` lists all; `goroutines -t` adds stacks; `goroutine <id> stack` for one. A deadlock shows goroutines parked in `sync.(*Mutex).Lock`, `chan send` or `chan receive`; record which goroutine holds what.
3. Common Go origins:

| Symptom | Check |
|---|---|
| `assignment to entry in nil map` | Struct zero value used without a constructor; map field never `make`d |
| `nil pointer dereference` | Interface holding a typed nil pointer (`var p *T = nil; var i I = p; i != nil` is true) |
| Loop variable captured | Go before 1.22: closures in `for` loops share one variable; Go 1.22+ gives each iteration its own (check `go` line in `go.mod`, which controls this semantics) |
| Slice aliasing | `append` to a slice that shares a backing array with another slice |
| Wrong time | `time.Parse` without a zone returns UTC; `time.Local` cached at start |

### Output
Failure frame evidence.

### Quality Gate
- `stack` output and the printed value of each variable on the failing line are pasted.

---

## Phase 3: Find the Origin

### Entry Criteria
- Bad value identified.

### Actions
1. `restart` the session, then `break <file>.go:<line>` where the value is created and `condition <bp id> <bool expr>` to stop only for the bad case (for example `condition 2 key == "k"`).
2. `continue`, then `next` (`n`), `step` (`s`), `stepout` (`so`) until the producing line. Use `display -a <expr>` to print an expression at every stop.
3. To watch a variable change (Delve 1.9+, amd64/arm64): `watch -w <variable>`; the program stops when it is written.
4. Write the defect sentence: "At <file>:<line>, <expr> is <value> because <cause>."
5. Exit with `exit` (answer `y` to kill the process).

### Output
`go_debug_trace`.

### Quality Gate
- The transcript shows the producing line executed (a `next` or `step` landing on it) and the bad value printed right after.

---

## Worked Example

Illustrative only.

```
$ dlv test ./internal/cache -- -test.run '^TestLRU_PutOnZeroValue$' -test.count=1
(dlv) continue
> [unrecovered-runtime-panic] runtime.fatalpanic() /usr/local/go/src/runtime/panic.go:...
(dlv) stack
0  runtime.fatalpanic ...
3  example.com/app/internal/cache.(*LRU).Put at ./lru.go:57
4  example.com/app/internal/cache.TestLRU_PutOnZeroValue at ./lru_test.go:6
(dlv) frame 3 print c.items == nil
true
(dlv) frame 3 list
    56:	func (c *LRU) Put(k string, v int) {
=>  57:		c.items[k] = c.list.PushFront(entry{k, v})
```

Defect: "At lru.go:57, `c.items` is nil because `LRU` is documented as usable as a zero value but `items` is only allocated in `NewLRU`."

---

## Exit Criteria

DONE when `go_debug_trace` has the stack, the values at the producing line, and a defect sentence tied to that line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `could not launch process: ... operation not permitted` on Linux | **Adjust**: ptrace is restricted; check `/proc/sys/kernel/yama/ptrace_scope` and run inside the container with `--cap-add=SYS_PTRACE --security-opt seccomp=unconfined`. |
| Phase 2 | Variables show `(optimized away)` | **Retry**: rebuild with `-gcflags='all=-N -l'`. |
| Phase 2 | Race bug does not reproduce under the debugger | **Adjust**: the debugger changes timing; use the `go test -race` report's two stacks as the evidence and inspect each access site with breakpoints. |
| Phase 3 | `watch` unsupported on the platform | **Adjust**: use a conditional breakpoint on every assignment site found by `grep -n "<field> ="`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
