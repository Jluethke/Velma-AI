# Cross-Compile a Rust Crate for aarch64

**One-line description:** Adds the `aarch64-unknown-linux-gnu` Rust target, sets the linker in `.cargo/config.toml` to the cross GCC, sets the C compiler for any `cc`-crate build scripts, builds with `cargo build --target`, and verifies the artifact under `target/aarch64-unknown-linux-gnu`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_triple` (string, required): Output of `xarch-target-triple-select`. The GNU triple, for example `aarch64-linux-gnu`; Rust uses the `aarch64-unknown-linux-gnu` spelling derived from it.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.
- `project_dir` (string, required): Path to the crate root that holds `Cargo.toml`.

---

## Outputs

- `cargo_config` (string): Path to the written `.cargo/config.toml`.
- `rust_report` (object): The Rust target name, the linker set, and the artifact verification result.

---

## Phase 1: Add the Target and Set the Linker

### Entry Criteria
- `rustup` and `cargo` are installed.
- `project_dir` holds `Cargo.toml`.

### Actions
1. Derive the Rust target from the libc in `target_triple`: `gnu` maps to `aarch64-unknown-linux-gnu`, `musl` maps to `aarch64-unknown-linux-musl`. The vendor field is `unknown`, not the GNU spelling.
2. Install the std for that target: `rustup target add aarch64-unknown-linux-gnu`. This gives a prebuilt std, not a compiler; you still need a cross linker.
3. Write `project_dir/.cargo/config.toml` with the linker:

```
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

Rust uses the C compiler as the linker driver. Use the prefixed cross gcc, substituting `toolchain_prefix`. Without this, the link step calls `cc` (the host linker) and fails with `relocation ... against ... can not be used`.
4. If the crate or a dependency uses the `cc` crate (builds C in `build.rs`), also set the C cross compiler so it does not use host `cc`: export `CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc` and `AR_aarch64_unknown_linux_gnu=aarch64-linux-gnu-ar`. The env var uses underscores, not hyphens.
5. Do not set a global `[build] target` that forces every build to aarch64; keep the target on the command line so native test builds still work.

### Output
`cargo_config` path.

### Quality Gate
- `rustup target list --installed` lists `aarch64-unknown-linux-gnu`.
- `.cargo/config.toml` has a `[target.aarch64-unknown-linux-gnu]` section with a `linker` line.

---

## Phase 2: Build and Verify

### Entry Criteria
- The target is installed and the linker is set.

### Actions
1. Build: `cargo build --release --target aarch64-unknown-linux-gnu`. The output lands under `project_dir/target/aarch64-unknown-linux-gnu/release/`.
2. If the link fails with `error: linking with cc failed`, the linker override was not picked up. Confirm `.cargo/config.toml` is at the crate root or a parent, not in a sibling dir, and the section name matches the target exactly.
3. Verify the binary: `readelf -h target/aarch64-unknown-linux-gnu/release/<bin> | grep Machine` must print `AArch64`.
4. Do not fix a `cc`-crate link error by removing the dependency; set the `CC_<target>` env var so its C code cross-builds.
5. Do not run `cargo test --target aarch64-unknown-linux-gnu` directly on the host; configure a runner (qemu) or route tests through `xarch-qemu-user-run-tests`.

### Output
`cargo_config`, `rust_report`.

### Quality Gate
- `cargo build --target aarch64-unknown-linux-gnu` exits 0.
- `readelf -h` on the output binary shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/cli`, `target_triple` = `aarch64-linux-gnu`.

```
$ rustup target add aarch64-unknown-linux-gnu
$ cat .cargo/config.toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
$ cargo build --release --target aarch64-unknown-linux-gnu
   Compiling cli v0.1.0
    Finished release [optimized] target(s)
$ readelf -h target/aarch64-unknown-linux-gnu/release/cli | grep Machine
  Machine:                           AArch64
```

`rust_report` = `{ "rust_target": "aarch64-unknown-linux-gnu", "linker": "aarch64-linux-gnu-gcc", "machine": "AArch64" }`.

---

## Exit Criteria

DONE when the aarch64 Rust target is installed, the build exits 0 with the cross linker, and the artifact is an `AArch64` ELF.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rustup target add` fails | **Adjust**: update rustup (`rustup update`); a very old toolchain may not have the target. |
| Phase 1 | Unsure of the exact C compiler env var name | **Adjust**: the form is `CC_<target with underscores>`; confirm in the `cc` crate docs rather than guessing. |
| Phase 2 | `linking with cc failed` | **Adjust**: the `linker` line is missing or the config file is in the wrong dir; fix and rebuild. |
| Phase 2 | A `cc`-crate dependency fails to build C | **Adjust**: export `CC_aarch64_unknown_linux_gnu` and `AR_aarch64_unknown_linux_gnu`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
