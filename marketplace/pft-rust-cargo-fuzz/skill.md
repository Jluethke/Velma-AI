# Rust Fuzzing with cargo-fuzz

**One-line description:** Creates cargo-fuzz targets with the `fuzz_target!` macro from `libfuzzer-sys` (raw `&[u8]` or a type deriving `arbitrary::Arbitrary`), runs them on nightly under AddressSanitizer with the seed corpus and dictionary for a fixed time, reads libFuzzer status and panic output, and collects the `fuzz/artifacts/<target>/crash-*` files with readable `cargo fuzz fmt` output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): Rust targets and harness contracts.
- `seed_corpus` (object[], required): Corpus directories from `pft-corpus-seeding`.
- `fuzz_dictionary` (object[], optional): Dictionary paths.
- `sanitizer_build_config` (object[], required): Chosen `--sanitizer` variants from `pft-sanitizer-builds`.
- `repo_path` (string, required): Crate root.
- `fuzz_time` (string, required): Seconds per target for `-max_total_time`, chosen by the user.

---

## Outputs

- `rust_fuzz_findings` (object[]): One row per target: target name, run command, final `#N DONE` or crash line, each artifact path (`crash-`, `oom-`, `timeout-`, `leak-` prefixes), its panic or sanitizer message and its `cargo fuzz fmt` rendering.

---

## Phase 1: Initialize and Write Targets

### Entry Criteria
- `rustup toolchain list` shows a nightly toolchain, or install it: `rustup toolchain install nightly`.
- Linux or macOS host (libFuzzer with sanitizers is not supported by cargo-fuzz on Windows MSVC; use WSL there).

### Actions
1. `cargo install cargo-fuzz`, then in the crate root `cargo fuzz init` (creates `fuzz/Cargo.toml`, `fuzz/fuzz_targets/fuzz_target_1.rs`). Add more with `cargo fuzz add <name>`; list with `cargo fuzz list`.
2. Raw bytes target:

```rust
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    if let Ok(msg) = mycrate::wire::decode(data) {          // Err is allowed by the contract
        let again = mycrate::wire::encode(&msg);
        assert_eq!(mycrate::wire::decode(&again).unwrap(), msg);  // round-trip
    }
});
```

3. Structured target: add `arbitrary = { version = "1", features = ["derive"] }` to `fuzz/Cargo.toml`, derive `#[derive(arbitrary::Arbitrary, Debug)]` on an input struct, and write `fuzz_target!(|input: OpSequence| { ... })`. `Debug` is what `cargo fuzz fmt` prints.
4. Do not use `std::process::exit`, threads, or `static mut` in a target. Panics count as crashes, which is intended.
5. Build: `cargo +nightly fuzz build <target>`.

### Output
Building fuzz targets.

### Quality Gate
- `cargo +nightly fuzz build <target>` exits 0.
- `cargo fuzz list` prints each target name.

---

## Phase 2: Run

### Entry Criteria
- Targets build; seeds in `fuzz/corpus/<target>/`.

### Actions
1. Run each target. Arguments after `--` go to libFuzzer:

```bash
cargo +nightly fuzz run <target> fuzz/corpus/<target> -- \
    -max_total_time=<fuzz_time> -dict=fuzz/<target>.dict -print_final_stats=1
```

Leave out `-dict=` when no dictionary exists. Add `--sanitizer <name>` before the target name for the variants in `sanitizer_build_config`; check `cargo fuzz run --help` for `-j`/`--jobs` and build-mode options.
2. Read the libFuzzer lines:

| Line | Meaning |
|---|---|
| `INFO: Seed: 1234567` | random seed for this run; rerun with `-seed=1234567` |
| `#2 INITED cov: 410 ft: 512 corp: 9/1203b exec/s: 0 rss: 38Mb` | corpus loaded; `cov` = covered edges, `ft` = features |
| `#4096 NEW cov: 433 ft: 570 corp: 14/1.4Kb lim: 43 exec/s: 2048 rss: 40Mb L: 12/31 MS: 2 ChangeByte-InsertRepeatedBytes-` | new coverage found |
| `REDUCE` | a smaller input with the same coverage replaced one |
| `pulse` | periodic heartbeat, no new coverage |
| `DONE cov: ... ` / `Done N runs in S second(s)` | budget reached without a crash |

3. On a crash, read the message (`thread '<unnamed>' panicked at src/wire.rs:88:21: index out of bounds` or `ERROR: AddressSanitizer: ...`) and the artifact line, for example `Test unit written to fuzz/artifacts/<target>/crash-6f0e...`. cargo-fuzz then prints a reproduce command and a minimize command.

### Output
Run logs and artifacts.

### Quality Gate
- Each log shows an `INITED` line and ends with either `Done ... runs` or an artifact path.
- `ls fuzz/artifacts/<target>/` lists exactly the artifacts mentioned in the log.

---

## Phase 3: Reproduce and Render Artifacts

### Entry Criteria
- At least one run finished.

### Actions
1. Reproduce each artifact: `cargo +nightly fuzz run <target> fuzz/artifacts/<target>/crash-6f0e...`. It must crash with the same message.
2. Render structured inputs: `cargo +nightly fuzz fmt <target> fuzz/artifacts/<target>/crash-6f0e...` prints the `Debug` form.
3. Minimize: `cargo +nightly fuzz tmin <target> fuzz/artifacts/<target>/crash-6f0e...` writes a `minimized-from-...` artifact; reproduce the minimized one too.
4. Classify artifact prefixes: `crash-` (panic or sanitizer error), `oom-` (over the libFuzzer `-rss_limit_mb` limit, documented default 2048), `timeout-` (over `-timeout`, documented default 1200 seconds), `leak-` (LeakSanitizer).
5. Do not commit `fuzz/artifacts/`; it is in the `.gitignore` that `cargo fuzz init` creates. Regression tests are made in `pft-crash-regression-test`.

### Output
`rust_fuzz_findings`.

### Quality Gate
- Every artifact reproduces with the same first error line.
- Every structured artifact has its `cargo fuzz fmt` output recorded.

---

## Worked Example

Illustrative. Target `decode_frame`, `fuzz_time` = 600 (user choice).

```text
$ cargo +nightly fuzz run decode_frame fuzz/corpus/decode_frame -- -max_total_time=600 -dict=fuzz/frame.dict
INFO: Seed: 3092845561
INFO: Loaded 1 modules (5120 inline 8-bit counters)
#2      INITED cov: 388 ft: 401 corp: 7/412b exec/s: 0 rss: 36Mb
#1873   NEW    cov: 402 ft: 431 corp: 8/431b lim: 21 exec/s: 0 rss: 37Mb L: 19/21 MS: 3 ...
thread '<unnamed>' panicked at src/frame.rs:142:30:
attempt to subtract with overflow
==40211== ERROR: libFuzzer: deadly signal
artifact_prefix='/w/fuzz/artifacts/decode_frame/'; Test unit written to /w/fuzz/artifacts/decode_frame/crash-91c1f0d4...
$ cargo +nightly fuzz tmin decode_frame fuzz/artifacts/decode_frame/crash-91c1f0d4...
CRASH_MIN: minimizing crash input: ... (4 bytes)
```

Finding: length field smaller than header size causes `len - HEADER` underflow at `frame.rs:142`.

---

## Exit Criteria

DONE when every Rust target ran for `fuzz_time` under its sanitizer variants and each artifact is reproduced, minimized and rendered.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `error: the option Z is only accepted on the nightly compiler` | **Retry**: run with `cargo +nightly fuzz`. |
| Phase 1 | Windows MSVC host | **Adjust**: run inside WSL or a Linux container. |
| Phase 2 | Crash on the first seed before fuzzing | **Return**: the seed itself is a finding; record it and remove it from the corpus for further runs. |
| Phase 2 | `exec/s` very low compared with other targets | **Return**: send the target to `pft-coverage-plateau-analysis` with the status lines. |
| Phase 3 | Artifact does not reproduce | **Adjust**: the target depends on state from earlier inputs; fix the harness so each input starts clean, then rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
