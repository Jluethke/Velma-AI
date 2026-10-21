# Temporary Log and Assertion Instrumentation

**One-line description:** Adds short-lived, clearly tagged log lines and invariant assertions along the failing path, one file at a time, to bracket where good state turns bad when a debugger is impractical (multi-process, timing-sensitive, production-like runs), then removes every one of them and proves the tree is clean.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.

---

## Outputs

- `instrumentation_findings` (object): The list of probe points (file:line, what was logged or asserted), the captured output from the red run, the last probe with good state and the first probe with bad state, and proof that all probes were removed (`git diff` output empty for source files).

---

## Phase 1: Plan the Probes

### Entry Criteria
- `regression_test` is red.
- `git -C <repo_path> stash list` and `git status --porcelain` recorded so the clean state is known.

### Actions
1. List the call path from the test entry to the failing line using the stack from the red run (or the debugger trace if one exists). Number the functions 1..N in call order.
2. Choose probe points by halving: first probe at the entry of function 1, the failing line, and the middle function. Each probe prints the variables that feed the failing line.
3. Choose a unique tag for every line so they are easy to find and delete: `REPRO-PROBE`.
4. Choose invariants worth asserting: things the code's own docs, type hints or comments say must hold (for example "size <= capacity", "list is sorted", "encoding is not None"). Do not invent invariants; take them from the code or spec and cite where.

### Output
Probe plan (file:line and expression per probe).

### Quality Gate
- Every planned invariant cites a docstring, comment, type or spec line.

---

## Phase 2: Insert Probes

### Entry Criteria
- Plan exists.

### Actions
1. Insert probes using the stack's stderr writer (stderr is not captured as program output in most harnesses; pass the flag in the table so the test runner shows it):

| `stack` | Log probe | Assertion probe | Show output |
|---|---|---|---|
| python | `print(f"REPRO-PROBE {var=!r}", file=sys.stderr)` (the `=` specifier needs Python 3.8+) | `assert size <= cap, f"REPRO-PROBE size={size} cap={cap}"` (asserts are removed under `python -O`) | `pytest -s` |
| node | `console.error("REPRO-PROBE", { var })` | `assert.ok(size <= cap, "REPRO-PROBE ...")` from `node:assert` | Jest and Vitest print `console.error` output by default unless the repo config passes `--silent` or sets `silent: true` |
| go | `fmt.Fprintf(os.Stderr, "REPRO-PROBE %s:%d var=%#v\n", "lru.go", 57, var)` | `if !(size <= cap) { panic(fmt.Sprintf("REPRO-PROBE size=%d cap=%d", size, cap)) }` | `go test -v` |
| java | `System.err.println("REPRO-PROBE var=" + var);` | `if (!(size <= cap)) throw new IllegalStateException("REPRO-PROBE ...");` (`assert` needs `-ea`, which Surefire enables by default via `enableAssertions`) | Surefire writes to `target/surefire-reports/*-output.txt` when `redirectTestOutputToFile` is set; otherwise console |
| rust | `eprintln!("REPRO-PROBE {var:?}");` or `dbg!(&var);` (prints file:line automatically) | `assert!(size <= cap, "REPRO-PROBE size={size} cap={cap}");` | `cargo test -- --nocapture` |
| cpp | `std::fprintf(stderr, "REPRO-PROBE %s:%d tail=%zu\n", __FILE__, __LINE__, tail_);` | `assert(size_ <= cap_ && "REPRO-PROBE");` (removed when `NDEBUG` is defined, which CMake Release sets) | run the test binary directly |

2. Insert probes in one file, run the red test, read the output, then move to the next file. Never insert probes into many files in one edit; you lose track of which output came from where.
3. Do not log secrets, tokens or full customer records; log lengths, types and hashes for sensitive values.
4. Do not change any logic while instrumenting. A probe is one added line; it never replaces a line.

### Output
Captured probe output from the red run.

### Quality Gate
- `git diff -U0 | grep '^[-+]' | grep -v '^+++\|^---'` shows only added lines containing `REPRO-PROBE` (no removed lines).
- The red run output contains at least one `REPRO-PROBE` line from each inserted probe, or the probe is recorded as not reached.

---

## Phase 3: Bracket, Then Remove

### Entry Criteria
- Probe output captured.

### Actions
1. Find the last probe with good state and the first with bad state. If they are in different functions, add a probe halfway between them (Phase 2 again). Repeat until they are adjacent statements or one function call apart.
2. Record the bracket in `instrumentation_findings`: good probe, bad probe, the statement(s) between them.
3. If an assertion probe fired first, that is the earliest detected violation; record its message.
4. Remove every probe: `git diff --name-only` lists the touched files; restore each with `git checkout -- <file>` (or `git restore <file>`). This also guarantees no logic change survives.
5. Confirm removal: `git grep -n "REPRO-PROBE"` prints nothing, and `git diff --stat` lists only the regression test files.

### Output
`instrumentation_findings`.

### Quality Gate
- `git grep -n "REPRO-PROBE"` output is empty.
- The bracket names two adjacent probe points and the statements between them.

---

## Worked Example

Illustrative only. `stack` = node; multi-worker server where the debugger changes timing.

- Phase 1: path `handler -> normalizeServices -> loadConfig -> listenAll`. Probes at entry of `handler`, start of `loadConfig`, and `listenAll` line 42.
- Phase 2: `console.error("REPRO-PROBE", { listen: cfg.listen })`. Output: `REPRO-PROBE { listen: undefined }` at `loadConfig` start; at `handler` entry the raw YAML has `services[0].listen`.
- Phase 3: added probe in `normalizeServices` shows `defaults` built only from `cfg.listen`. Bracket: good at `normalizeServices` entry, bad after line 30 `const { defaults } = cfg.listen ?? {}`. All probes removed; `git grep -n "REPRO-PROBE"` empty.

---

## Exit Criteria

DONE when the good-to-bad bracket is narrowed to adjacent probe points and the source tree contains no probe lines.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Probe output not visible | **Adjust**: use the "Show output" flag from the table; for multi-process apps, write to a file under `.repro/` named by PID. |
| Phase 2 | Adding a probe makes the bug disappear | **Adjust**: timing-sensitive; record this as evidence of a race and use the race detector or sanitizer instead. |
| Phase 3 | Probe lines left in the tree | **Stop**: restore files with `git checkout -- <file>` before leaving this flow. |
| Any | Weak model "fixes" the bug while instrumenting | **Stop**: restore the file; fixes happen only in `repro-minimal-fix`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
