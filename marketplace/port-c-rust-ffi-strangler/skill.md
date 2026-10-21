# Port C to Rust FFI Strangler

**One-line description:** Sets up a mixed C and Rust build so functions move from C to Rust one at a time behind the same C ABI: a Rust `staticlib` with `cbindgen`-generated headers for C callers, `bindgen` plus the `cc` crate for Rust calling remaining C, panic containment at the boundary, and a symbol check proving which implementation is linked.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the C repository at the reference commit.
- `target_repo` (string, required): Path for the Rust crate (may be a subdirectory of the C repo, for example `rust/`).
- `c_rust_idioms` (object, required): Output of `port-c-to-rust-idiom-map`; supplies `type_map` and `ownership_table`.

---

## Outputs

- `ffi_build_plan` (object): `direction` (C calls Rust, Rust calls C, or both), crate layout, `Cargo.toml` and `build.rs` content, C build changes, header generation command, the per-function swap procedure, and the symbol check command.

---

## Phase 1: Choose the Direction

### Entry Criteria
- `c_rust_idioms` exists.

### Actions
1. Pick the direction with this table:

| Situation | Direction | Mechanism |
|---|---|---|
| The C program's `main` and build stay for now; leaf functions move to Rust | C calls Rust | Rust `staticlib` linked into the C build; `cbindgen` writes the header |
| Rust becomes the program; some C remains | Rust calls C | `cc` crate compiles the remaining C files in `build.rs`; `bindgen` generates bindings from the C headers |
| Both, during the middle of the port | both | both of the above; keep C to Rust and Rust to C calls in separate modules |

2. Default for a library ported leaf-first: C calls Rust.

### Output
`direction` with reason.

### Quality Gate
- The chosen row and the reason are recorded.

---

## Phase 2: Build Setup

### Entry Criteria
- Direction chosen.

### Actions
1. C calls Rust:
   - `Cargo.toml`: `[lib] crate-type = ["staticlib"]` (use `cdylib` only if the C build links shared libraries). Set `[profile.release] panic = "abort"` only if the user accepts that a Rust panic aborts the process; otherwise contain panics as in action 3.
   - Export functions: `#[no_mangle] pub extern "C" fn mylib_parse_port(s: *const c_char, out: *mut u16) -> c_int`. In the Rust 2024 edition the attribute is written `#[unsafe(no_mangle)]`.
   - Header: `cbindgen --config cbindgen.toml --crate mylib --output include/mylib_rs.h`. Put `language = "C"` and an include guard in `cbindgen.toml`.
   - Link from Make: build with `cargo build --release`, then add `target/release/libmylib.a` and the system libraries printed by `cargo rustc --release -- --print native-static-libs` (look for the `native-static-libs:` note) to the link line.
   - Link from CMake: use Corrosion (`corrosion_import_crate(MANIFEST_PATH rust/Cargo.toml)`, then `target_link_libraries(app PRIVATE mylib)`), or the manual Make approach through `add_custom_command`.
2. Rust calls C:
   - `build.rs`: `cc::Build::new().file("c/legacy.c").include("include").compile("legacy");` and `println!("cargo:rerun-if-changed=c/legacy.c");`.
   - Bindings: `bindgen include/legacy.h -o src/ffi/legacy.rs --allowlist-function 'legacy_.*'` (or the `bindgen` crate from `build.rs`). Wrap every generated `unsafe` function in a safe Rust function in one module; the rest of the crate calls only the safe wrappers.
3. Boundary rules, for both directions:
   - A panic unwinding out of an `extern "C"` function aborts the process (Rust 1.81 and later). Wrap each exported function body in `std::panic::catch_unwind` and convert a panic to an error return code.
   - Null and validity: check every incoming pointer for null before use; document that the caller guarantees length and lifetime. One `// SAFETY:` comment per `unsafe` block.
   - Memory: memory allocated by Rust is freed only by a Rust-exported function (`mylib_free_string`); memory allocated by C is freed by C. Follow `ownership_table` row by row.
   - Strings: incoming `const char *` becomes `CStr::from_ptr(s).to_bytes()`; outgoing strings are `CString::new(bytes)` (fails if bytes contain NUL) then `into_raw`.
   - Types: use `core::ffi::c_int`, `c_long`, `c_char` at the boundary as `type_map` says.

### Output
Build files and boundary rules in `ffi_build_plan`.

### Quality Gate
- A trivial exported Rust function (`mylib_rs_version`) called from C builds, links, and runs: the C program prints its return value.
- `nm -g --defined-only target/release/libmylib.a | grep mylib_rs_version` prints the symbol (on macOS symbols carry a leading underscore).

---

## Phase 3: Per-Function Swap Procedure

### Entry Criteria
- Mixed build links.

### Actions
1. Write the procedure, one function per commit, in `port-file-order-plan` order:
   1. Implement the function in safe Rust following `c_rust_idioms` (`pub fn parse_port(s: &[u8]) -> Result<u16, PortError>`), plus a thin exported wrapper with the exact C signature.
   2. Remove the C definition (delete the function body from the `.c` file, keep the prototype in the public header or switch the header include to the cbindgen header). Do not leave both definitions: duplicate symbols fail to link, and weak symbols would hide which one runs.
   3. Prove which implementation is linked: `nm -g --defined-only build/app | grep parse_port` shows one `T` symbol, and `nm build/legacy.o | grep parse_port` shows it as `U` (undefined) in the C objects that call it.
   4. Run the C project's own tests, then the golden corpus through the C harness from `port-c-golden-capture` (it links the library, so it now calls Rust), then `cargo test` and `cargo test --release`.
   5. Run the harness under AddressSanitizer as well (Rust code is not instrumented, but ASan still catches C-side misuse of Rust-returned buffers).
   6. Commit ("move parse_port to Rust").
2. Forbidden shortcuts:
   - Exporting a Rust function whose body is a single large `unsafe` block copied from c2rust output: `rg -c "unsafe" src/` must not grow by more than the wrapper's blocks.
   - Changing the C header signature in the same commit as moving the implementation.

### Output
`ffi_build_plan`.

### Quality Gate
- The procedure includes the exact `nm` commands and expected symbol types.
- The golden replay through the C harness is part of every swap.

---

## Worked Example

Illustrative. `libnetcfg` (Make, x86_64 Linux), first function `parse_port`.
```
$ cargo build --release --manifest-path rust/Cargo.toml
$ cargo rustc --release --manifest-path rust/Cargo.toml -- --print native-static-libs 2>&1 | grep native-static-libs
note: native-static-libs: -lgcc_s -lutil -lrt -lpthread -lm -ldl -lc
$ make LDLIBS="rust/target/release/libnetcfg_rs.a -lgcc_s -lutil -lrt -lpthread -lm -ldl -lc"
$ nm -g --defined-only build/netcfg | grep parse_port
0000000000012a40 T parse_port
$ nm build/config.o | grep parse_port
                 U parse_port
$ make test && python tools/run_cases.py --bin build-golden/golden_harness --cases cases.jsonl --compare golden/
41 tests passed
B-003: 31/31 records match
```

---

## Exit Criteria

DONE when the direction is chosen, the mixed build links with a working probe function, boundary rules are written, and the per-function swap procedure proves by symbol table which implementation runs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Undefined references to `__rust_*`, `pthread_*`, or `dl*` at link time | **Adjust**: add every library from `--print native-static-libs`, in the printed order, after the `.a`. |
| Phase 2 | `cbindgen` emits nothing for a function | **Adjust**: check it is `pub`, `extern "C"`, and `no_mangle`, and that the module is reachable from `lib.rs`. |
| Phase 3 | Duplicate symbol at link time | **Adjust**: the C definition was not removed; remove it. |
| Phase 3 | Golden records fail only through the C harness, not in `cargo test` | **Stop**: the wrapper converts types or errors wrongly; check `type_map` and errno mapping. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
