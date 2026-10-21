# Native Root Cause with gdb, lldb and Core Dumps (C, C++, Rust)

**One-line description:** Runs the red native test binary under gdb or lldb (or loads a core dump), uses `bt`, `frame`, `info locals`, `print`, watchpoints and `rr` reverse execution where available, and reads sanitizer reports, to find the instruction that first corrupts or misuses state in C, C++ or Rust code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `native_debug_trace` (object): Debugger transcript, backtrace, register or memory evidence where relevant, the origin line, and a one-sentence defect statement. Empty when `stack` is not cpp or rust.

---

## Phase 1: Get a Debuggable Binary and Pick a Debugger

### Entry Criteria
- `regression_test` is red.

### Actions
1. Build with debug info and low optimization: C/C++ `-g -O0` (or `-Og` with GCC); CMake `-DCMAKE_BUILD_TYPE=Debug`. Rust: `cargo test --no-run` prints the test binary path (`Executable unittests src/lib.rs (target/debug/deps/<crate>-<hash>)`); debug profile includes debug info by default.
2. If the bug needs optimization to appear, use `-O2 -g` (`RelWithDebInfo`) and expect `<optimized out>` for some variables.
3. Pick the debugger:

| Platform | Debugger | Rust wrapper |
|---|---|---|
| Linux | gdb | `rust-gdb` (loads pretty printers for `Vec`, `String`, `Option`) |
| macOS | lldb (gdb needs code signing) | `rust-lldb` |
| Windows MSVC toolchain | WinDbg or the Visual Studio debugger; `lldb` works for Clang builds | none |

4. If `rr` is installed (Linux x86_64 with supported CPU performance counters; check `rr --version` and the rr docs), record once: `rr record <binary> <args>`; replay with `rr replay` as many times as needed with identical execution. It is especially useful for intermittent memory corruption.

### Output
Binary path, debugger, and whether rr is available.

### Quality Gate
- `file <binary>` (Linux/macOS) output contains `with debug_info` or `not stripped`, or `readelf -S <binary> | grep debug_info` prints a section.

---

## Phase 2: Stop at the Failure

### Entry Criteria
- Debuggable binary exists.

### Actions
1. Start with the single-test filter:
   - gdb: `gdb --args ./build-repro/tests/unit_tests --gtest_filter='RingBuffer.PushPastCapacityWraps'`, then `run`.
   - lldb: `lldb -- ./build-repro/tests/unit_tests --gtest_filter='RingBuffer.PushPastCapacityWraps'`, then `run`.
   - Rust: `rust-gdb --args target/debug/deps/<crate>-<hash> parser::tests::<name> --exact`.
2. Stop points by failure type:

| Failure | gdb | lldb |
|---|---|---|
| SIGSEGV / SIGABRT | Stops automatically on the signal | Stops automatically |
| C++ exception | `catch throw` before `run` | `breakpoint set -E c++` |
| Rust panic | `break rust_panic` (symbol exists in std; verify with `info functions rust_panic`) | `breakpoint set -n rust_panic` |
| ASan report | `break __asan::ReportGenericError` or run with `ASAN_OPTIONS=abort_on_error=1` so it stops on `SIGABRT` | same symbol with `breakpoint set -n` |
| GoogleTest assertion | `--gtest_break_on_failure` makes a failed assertion trap into the debugger | same flag |

3. When stopped, paste: `bt` (gdb) / `bt` (lldb, alias of `thread backtrace`); `frame <n>` / `frame select <n>` to the first in-project frame; `info locals` and `info args` / `frame variable`; `print <expr>` / `p <expr>`; `x/16xb <addr>` / `memory read -s1 -c16 <addr>` for raw bytes.

### Output
Failure frame evidence.

### Quality Gate
- Backtrace pasted with at least one frame showing an in-project `file:line`.

---

## Phase 3: Find Who Corrupted the State

### Entry Criteria
- Bad value or bad address identified.

### Actions
1. If the bad value is a field that was correct earlier, set a hardware watchpoint and rerun: gdb `watch <expr>` (or `watch -l <expr>` to watch the location even after leaving scope); lldb `watchpoint set variable <var>` or `watchpoint set expression -- <addr>`. Each stop shows old and new value and the writing line.
2. With rr: at the crash run `reverse-continue` after setting the watchpoint; execution runs backward to the last write. This avoids rerunning a nondeterministic program.
3. Read sanitizer reports for origins: ASan `heap-use-after-free` prints three stacks: the bad access, `freed by thread T0 here:`, and `previously allocated by thread T0 here:`. The freed-by stack is often the defect location.
4. Native-specific origins to check:

| Symptom | Check |
|---|---|
| Off-by-one heap overflow | Loop bound `<=` versus `<`; capacity versus size; missing room for `'\0'` |
| Use after free | Iterator or reference invalidated by `push_back`, `erase`, `rehash`; a returned `std::string_view` or pointer into a temporary |
| Value differs only at `-O2` | Signed overflow, strict aliasing, uninitialized read (UB) |
| Rust panic `index out of bounds` | Length computed from a different collection; `usize` subtraction wrapped in release (debug panics with `attempt to subtract with overflow`) |
| Rust `unsafe` corruption | Raw pointer outliving its owner; check every `unsafe` block on the path with `git grep -n "unsafe" <files>` |

5. Write the defect sentence: "At <file>:<line>, <expr> writes/reads <what> because <cause>."
6. Core dumps (when the crash is from the field): `ulimit -c unlimited`; on systemd hosts `coredumpctl list` and `coredumpctl gdb <pid>`; then `bt full` and `info registers`. The binary must be the exact build that crashed.

### Output
`native_debug_trace`.

### Quality Gate
- The transcript shows the corrupting write (watchpoint hit, sanitizer freed-by stack, or stepped line) with the bad value, not only the crash site.

---

## Worked Example

Illustrative only.

```
$ gdb --args ./build-repro/tests/unit_tests --gtest_filter=RingBuffer.PushPastCapacityWraps
(gdb) break ring_buffer.hpp:41 if tail_ == cap_
(gdb) run
Breakpoint 1, RingBuffer<int>::push (this=0x7fffffffd8d0, v=@0x7fffffffd8ac: 4) at src/ring_buffer.hpp:41
41	    buf_[tail_++] = v;
(gdb) print tail_
$1 = 4
(gdb) print cap_
$2 = 4
(gdb) list 38,42
38	  void push(const T& v) {
39	    if (size_ == cap_) head_ = (head_ + 1) % cap_;
40	    else ++size_;
41	    buf_[tail_++] = v;
42	    if (tail_ > cap_) tail_ = 0;
```

The write at line 41 runs with `tail_ == 4`, one past the last slot. Defect: "At ring_buffer.hpp:42, the wrap check uses `>` instead of `>=`, so `tail_` reaches `cap_` and the next push at line 41 writes one element past the end of `buf_`."

---

## Exit Criteria

DONE when `native_debug_trace` contains a backtrace, the corrupting or misusing line with values, and a defect sentence tied to that line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ptrace: Operation not permitted` | **Adjust**: check `/proc/sys/kernel/yama/ptrace_scope`; in Docker add `--cap-add=SYS_PTRACE`. |
| Phase 1 | rr fails with a CPU or virtualization error | **Adjust**: continue without rr; use watchpoints and sanitizers. |
| Phase 2 | Bug disappears under the debugger | **Adjust**: timing or uninitialized-memory dependent; use the sanitizer report or a core dump instead of live stepping. |
| Phase 3 | Too many watchpoint hits | **Adjust**: add a condition: gdb `condition <n> <expr>`, lldb `watchpoint modify -c '<expr>' <n>`. |
| Any | Weak model blames the compiler | **Stop**: a compiler bug needs a reduced testcase that fails across compilers and flags; first run UBSan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
