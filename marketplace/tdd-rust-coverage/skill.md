# TDD Rust Coverage With cargo-llvm-cov

**One-line description:** Measures line, region and function coverage of a Rust crate with cargo-llvm-cov (LLVM source-based coverage), reads its summary and HTML views, and maps each uncovered region to a missing behavior or dead code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Files and suite result from `tdd-refactor-under-green`.
- `coverage_floor` (number, optional): Minimum line percentage set by the user or project policy. When absent, no threshold is applied.

---

## Outputs

- `coverage_report` (object): Totals for Regions, Functions, Lines (and Branches if measured), per-file rows, and report paths (`target/llvm-cov/html/index.html`, `lcov.info`).
- `uncovered_lines` (object[]): Each uncovered line or region with file, line, classification and action.

---

## Phase 1: Install and Run

### Entry Criteria
- `cargo test` passes.

### Actions
1. Install: `cargo install cargo-llvm-cov --locked` and `rustup component add llvm-tools-preview`. (`cargo +stable install cargo-llvm-cov --locked` if several toolchains are installed.)
2. Run the summary: `cargo llvm-cov`. It runs `cargo test` with instrumentation and prints a table.
3. HTML: `cargo llvm-cov --html` writes `target/llvm-cov/html/index.html`; `--open` opens it.
4. LCOV for CI tools: `cargo llvm-cov --lcov --output-path lcov.info`.
5. Workspaces: add `--workspace`. Integration tests in `tests/` are included automatically. Doc tests need `--doctests` and a nightly toolchain (check `cargo llvm-cov --help`).
6. Branch coverage: `--branch` exists but needs a nightly toolchain; record "branches not measured" on stable.
7. Clean stale data between configuration changes: `cargo llvm-cov clean --workspace`.

### Output
Coverage table and HTML.

### Quality Gate
- The table prints a `TOTAL` row.
- `target/llvm-cov/html/index.html` exists.

---

## Phase 2: Read the Table and HTML

### Entry Criteria
- Table printed.

### Actions
1. Columns: `Filename | Regions | Missed Regions | Cover | Functions | Missed Functions | Executed | Lines | Missed Lines | Cover`.
   - A region is a span of code that runs as a unit (for example each side of `&&`, each `match` arm, each `?` early return). Missed regions are a finer signal than missed lines.
   - `Missed Functions` includes generic instantiations and closures never called.
2. In the HTML, red lines and red-highlighted spans are not executed; a count of `0` in the left margin marks them.
3. For a text list of uncovered lines: `cargo llvm-cov --text | grep -n "|      0|"` or open the HTML per file. Copy each uncovered span for files in `refactored_code` into `uncovered_lines`.
4. The `?` operator creates a hidden early-return region; a missed `?` region means no test made that call fail.

### Output
Draft `uncovered_lines`.

### Quality Gate
- Every file in `refactored_code` with Missed Regions above zero has entries in `uncovered_lines`.

---

## Phase 3: Classify and Act

### Entry Criteria
- Draft list exists.

### Actions
1. Classify:

| Uncovered code | Classification | Action |
|---|---|---|
| `Err` path or `?` return for an error a requirement describes | missing behavior | make the dependency fail through its trait seam and drive it from red |
| `match` arm a requirement describes | missing behavior | add a case |
| `unreachable!()`, impossible arm required by exhaustive match | defensive only | keep |
| Function or impl nothing calls (also flagged by `cargo build` dead_code warnings) | dead code | delete under green |
| `main.rs` wiring | excluded | `--ignore-filename-regex 'main\.rs'` or keep thin |

2. No test may call code without asserting its result.
3. If `coverage_floor` is given: `cargo llvm-cov --fail-under-lines <coverage_floor>` and record the exit code. Otherwise report totals without a verdict.

### Output
`coverage_report`, `uncovered_lines`.

### Quality Gate
- Each entry has a classification and action.
- Any threshold uses only `coverage_floor`.

---

## Worked Example

Illustrative only. Crate `tally`.

```
$ cargo llvm-cov
Filename      Regions  Missed Regions  Cover   Functions  Missed Functions  Executed  Lines  Missed Lines  Cover
src/lib.rs         24               3  87.50%          5                 0   100.00%     40             2  95.00%
TOTAL              24               3  87.50%          5                 0   100.00%     40             2  95.00%
```

HTML shows `let n: u32 = s.parse()?;` with the `?` region red: no test passes a non-numeric string. The requirement says non-numeric input returns `Error::NotANumber`: missing behavior, new row B05.

---

## Exit Criteria

DONE when coverage was measured with cargo-llvm-cov, every missed region in the changed files is classified with an action, and any floor came from `coverage_floor`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `failed to find llvm-tools-preview` | **Adjust**: `rustup component add llvm-tools-preview` for the active toolchain. |
| Phase 1 | Numbers include stale data | **Retry**: `cargo llvm-cov clean --workspace`, rerun. |
| Phase 2 | Generic function shows as missed although tested | **Adjust**: it is an uninstantiated copy; check the per-instantiation view in HTML before adding tests. |
| Phase 3 | Floor not met | **Return**: report totals and classified gaps; do not lower the floor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
