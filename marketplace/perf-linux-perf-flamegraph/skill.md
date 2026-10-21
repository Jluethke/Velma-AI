# Native CPU Flame Graph with Linux perf (C, C++, Rust)

**One-line description:** Builds a native binary with symbols and frame pointers, samples it with `perf record -g`, reads `perf report`, turns `perf script` output into an SVG flame graph with Brendan Gregg's FlameGraph scripts (or `cargo flamegraph` for Rust), and reads hardware counters with `perf stat`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Command, inputs, sizes.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `native_perf_profile` (object): Paths to `perf/profiles/perf.data`, `perf/profiles/out.folded` and `perf/profiles/flame.svg`, the build flags, the record command, `perf --version`, sample count, top symbols by self (`--no-children`) percentage, and `perf stat` counters (cycles, instructions, IPC, cache and branch misses).

---

## Phase 1: Build for Profiling and Get Access

### Entry Criteria
- Linux host or VM (perf is Linux only). `perf --version` exits 0; install with `linux-tools-common linux-tools-$(uname -r)` (Ubuntu) or `perf` (Fedora).

### Actions
1. Rebuild with optimization kept, plus symbols and frame pointers:

   | Stack | Build |
   |---|---|
   | C, C++ (CMake) | `cmake -B build-prof -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCMAKE_C_FLAGS="-fno-omit-frame-pointer" -DCMAKE_CXX_FLAGS="-fno-omit-frame-pointer" && cmake --build build-prof` |
   | C, C++ (Make) | add `-O2 -g -fno-omit-frame-pointer` to `CFLAGS`/`CXXFLAGS` |
   | Rust | in `Cargo.toml` add `[profile.release]` `debug = true`, then `RUSTFLAGS="-C force-frame-pointers=yes" cargo build --release` |

   Do not profile `-O0` or debug builds; their hotspots differ from release.
2. Check `cat /proc/sys/kernel/perf_event_paranoid`. Higher values restrict unprivileged profiling (see the kernel `perf-security` documentation). If `perf record` fails with a permission error, run it with `sudo` or lower the value temporarily with `sudo sysctl kernel.perf_event_paranoid=<value from the kernel docs>` and record the old value for revert.
3. In VMs and containers hardware events may be missing; perf then falls back to `cpu-clock`. Record which event was used (shown in `perf report` header).

### Output
Profiling build and confirmed access.

### Quality Gate
- `file <binary>` output contains `with debug_info` and `not stripped`.
- `perf stat -e task-clock -- true` exits 0.

---

## Phase 2: Record and Report

### Entry Criteria
- Profiling build exists.

### Actions
1. Record with call graphs at the largest size:

```bash
perf record -F 99 -g -o perf/profiles/perf.data -- ./build-prof/report --input data/orders_120000.csv
```

   `-F 99` is the sampling frequency used in the FlameGraph README (an odd rate avoids lockstep with periodic timers). `-g` uses frame pointers. If stacks look broken (many one-frame stacks), rerun with `--call-graph dwarf` (larger files, works without frame pointers).
2. Read self time: `perf report -i perf/profiles/perf.data --stdio --no-children --sort symbol | head -40`. Percentages are self samples per symbol.
3. Read inclusive time: `perf report -i perf/profiles/perf.data --stdio --children --sort symbol | head -40`.
4. Annotate the top symbol: `perf annotate -i perf/profiles/perf.data --stdio <symbol>` shows hot instructions with source lines.
5. Read counters on the same command: `perf stat -e cycles,instructions,cache-misses,branch-misses -- ./build-prof/report --input data/orders_120000.csv`. Record `insn per cycle` (IPC). Low IPC with many cache misses points to memory access patterns rather than instruction count.

### Output
`perf.data`, report tables, annotation, counters.

### Quality Gate
- `perf report` header shows the event and sample count; both recorded.
- The top 10 symbols by self percentage are recorded.

---

## Phase 3: Flame Graph

### Entry Criteria
- Report read.

### Actions
1. Get the scripts once: `git clone https://github.com/brendangregg/FlameGraph perf/tools/FlameGraph` (outside the source tree is also fine; do not commit it).
2. Generate:

```bash
perf script -i perf/profiles/perf.data > perf/profiles/out.perf
perf/tools/FlameGraph/stackcollapse-perf.pl perf/profiles/out.perf > perf/profiles/out.folded
perf/tools/FlameGraph/flamegraph.pl perf/profiles/out.folded > perf/profiles/flame.svg
```

   For Rust, `cargo install flamegraph` then `cargo flamegraph --bench build_report -- --bench` or `cargo flamegraph --bin report -- --input data/orders_120000.csv` produces `flamegraph.svg` in one step.
3. For C++ run `perf script` output through `c++filt` if names are mangled, or pass `--demangle` (check `perf script --help`).
4. Read the SVG: x is not time (stacks are sorted alphabetically and merged); width is share of samples; a wide frame with nothing above it is self time. Ctrl+F searches and shows `Matched: NN%`.
5. Fill `native_perf_profile`.

### Output
`native_perf_profile`.

### Quality Gate
- `perf/profiles/flame.svg` exists and opens in a browser.
- `wc -l perf/profiles/out.folded` is greater than 0.

---

## Worked Example

Illustrative. C++ binary `report`, 120,000 rows.

```
$ perf report -i perf/profiles/perf.data --stdio --no-children --sort symbol | head
# Samples: 1K of event 'cycles'
    71.40%  [.] Report::findCustomer(std::string const&)
     9.12%  [.] std::__cxx11::basic_string<...>::compare
     4.03%  [.] malloc
$ perf stat -e cycles,instructions,cache-misses -- ./build-prof/report --input data/orders_120000.csv
  62,113,450,201  cycles
  48,902,117,330  instructions   #  0.79  insn per cycle
     912,004,551  cache-misses
```

---

## Exit Criteria

DONE when a release build with symbols and frame pointers was sampled, self and inclusive symbol tables and `perf stat` counters are recorded, and `flame.svg` exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Not Linux | **Adjust**: use Instruments (macOS) or Windows Performance Recorder, or run in a Linux VM; record the switch. |
| Phase 1 | Permission denied for perf events | **Adjust**: use `sudo` or adjust `perf_event_paranoid` per kernel docs, recording the revert. |
| Phase 2 | Stacks are one frame deep | **Retry**: rebuild with frame pointers or record with `--call-graph dwarf`. |
| Phase 2 | Symbols show as hex | **Return**: to Phase 1; the binary is stripped. |
| Phase 3 | `stackcollapse-perf.pl: Permission denied` | **Adjust**: `chmod +x` the scripts or run with `perl`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
