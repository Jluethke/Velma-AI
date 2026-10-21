# Port C to Rust Idiom Map

**One-line description:** Produces the project-specific C to Rust translation table (pointer plus length to slices, NUL-terminated strings, ownership of malloc and free, errno and return codes to `Result`, `goto cleanup` to `Drop`, unions, macros, integer type widths, implicit conversions, global state) with the Clippy and Miri checks that catch the common mistakes, and uses c2rust output only as a reference translation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the C repository at the reference commit.
- `dependency_map` (object[], required): Output of `port-dependency-equivalence-map`.
- `integer_findings` (object[], required): Output of `port-integer-semantics-audit`.

---

## Outputs

- `c_rust_idioms` (object): `rust_edition` and toolchain, `type_map` (C type to Rust type for this platform), `rules` (one row per C construct used: C form, Rust form, trap, example location), `ownership_table` (who allocates and frees each heap object), and `checks`.

---

## Phase 1: Platform Types and Ownership

### Entry Criteria
- `golden/ENV.json` from `port-c-golden-capture` exists (platform facts).

### Actions
1. Fill `type_map` from the platform facts. Use exact-width Rust types inside Rust code and `core::ffi` types only at the C boundary.

| C type | Inside Rust | At the FFI boundary | Note |
|---|---|---|---|
| `int` | `i32` when `__SIZEOF_INT__` is 4 | `core::ffi::c_int` | |
| `long` | `i64` on LP64 (Linux, macOS), `i32` on 64-bit Windows | `c_long` | never hardcode `i64` for `long` if Windows is a target |
| `size_t` | `usize` | `usize` | |
| `ssize_t`, `ptrdiff_t` | `isize` | `isize` | |
| `char` (text) | `u8` | `c_char` (`i8` on x86_64, `u8` on aarch64 Linux) | sign of `char` changes comparisons like `c < 0` and `>> ` |
| `uint8_t` ... `uint64_t`, `int8_t` ... | `u8` ... `u64`, `i8` ... | same | |
| `bool` (`_Bool`) | `bool` | `bool` | |
| `float`, `double` | `f32`, `f64` | same | C may compute in higher precision on x87 (`FLT_EVAL_METHOD`); check if the C was built for 32-bit x86 |
| enum | Rust `enum` with explicit discriminants internally | `c_int` at the boundary, converted with `TryFrom` | a C enum variable can hold any int; a Rust enum holding an invalid value is undefined behavior |

2. Build `ownership_table`: for every `malloc`, `calloc`, `realloc`, `strdup`, and `free` (`rg -n "\b(malloc|calloc|realloc|strdup|free)\(" --type c`), record which function allocates, which frees, and whether ownership transfers to the caller (look at the header comments and every call site). This decides `Box`, `Vec`, `&`, or `&mut` per pointer.
3. Optional reference translation: generate `compile_commands.json` (`bear -- make`, or CMake with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`), then `c2rust transpile compile_commands.json --output-dir c2rust_ref/`. The output is unsafe, non-idiomatic Rust that preserves C semantics exactly; use it to answer "what exactly does this expression do" (integer promotions, casts), never as the port itself. Check `c2rust --help` for the flags of your installed version.

### Output
`type_map`, `ownership_table`, optional `c2rust_ref/`.

### Quality Gate
- Every heap allocation site has an ownership row with allocator and freer named.
- `type_map` lists the `long` and `char` decisions with the platform facts that justify them.

---

## Phase 2: Fill the Translation Table

### Entry Criteria
- Phase 1 complete.

### Actions
1. Count each construct with `rg` and keep only nonzero ones in `rules`, with one real example location.

| C | Rust | Trap |
|---|---|---|
| `const T *p, size_t n` | `&[T]` | out-of-bounds read in C is silent; Rust indexing panics. Use iterators or `.get(i)` where C relied on a check |
| `T *p, size_t n` written | `&mut [T]` | two pointers into the same buffer: use `split_at_mut` |
| `const char *s` NUL-terminated | `&CStr` at FFI, then `&[u8]` (`to_bytes()`) inside | `to_str()` fails on non-UTF-8; C strings are bytes |
| returned `char *` the caller must `free` | `String` / `Vec<u8>` inside; at FFI `CString::into_raw` plus a `mylib_free_string` that calls `CString::from_raw` | never let C `free()` memory Rust allocated |
| `malloc(sizeof(T))` single object | `Box<T>` | |
| growable array with `realloc` | `Vec<T>` with `reserve` | C growth factor does not matter for output; do not port it |
| `memcpy(dst, src, n)` | `dst[..n].copy_from_slice(&src[..n])` | panics on length mismatch, which C would corrupt silently |
| `memmove` within one buffer | `buf.copy_within(src_range, dst_start)` | |
| `memset(p, 0, n)` | `buf.fill(0)` | |
| return `-1` and set `errno` | `Result<T, Error>` with an enum variant per errno value used | map exactly the errno values the C code sets; the corpus records them |
| return `NULL` on failure | `Option<T>` or `Result` | |
| `goto cleanup;` chains | early `return` or `?` with `Drop` on owned values; a guard struct for non-memory resources (file descriptors, locks) | do not port the label structure |
| `union` with a tag field | `enum` with data | `#[repr(C)] union` only in FFI types |
| `#define N 16` | `const N: usize = 16;` | |
| function-like macro | `#[inline] fn`, or a generic function | macros that evaluate an argument twice (`MAX(a++, b)`) change behavior when turned into functions; check each call |
| X-macro tables | `macro_rules!` or a `const` array of structs | |
| function pointer plus `void *user_data` | closure `impl FnMut(...)`, generic `F: FnMut`, or `&mut dyn FnMut` | |
| `static` mutable global | struct passed explicitly; or `static X: Mutex<T>` / `OnceLock<T>` | `static mut` references are denied by default in Rust 2024 (`static_mut_refs`) |
| linked list or graph with raw pointers | `Vec<Node>` plus `usize` indices, or an arena crate (`slotmap`, `typed-arena`) | `Rc<RefCell<...>>` compiles but panics at runtime on overlapping borrows |
| implicit integer conversion | `T::try_from(x)?` or `x as T` only where truncation is the intended C behavior (comment it) | `as` truncates and sign-converts silently |
| unsigned wraparound used on purpose (hashes, CRC) | `wrapping_add`, `wrapping_mul`, `Wrapping<u32>` | plain `+` panics in debug builds |
| signed arithmetic | `checked_*` where `integer_findings` flagged overflow | debug and release differ unless explicit |
| `printf` family | `write!` / `format!` | see `float_findings`; `%g` has no direct equivalent |
| `qsort` | `slice.sort_unstable_by` (qsort is not stable either) | comparator returning `a - b` in C overflows; use `cmp` |
| `bsearch` | `slice.binary_search_by` | returns `Err(insert_pos)` on miss |
| `assert()` | `debug_assert!` if `NDEBUG` is set in release builds of the C code, else `assert!` | check the C build flags for `-DNDEBUG` |

2. Set `checks`:
```
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo test --release                       # overflow behavior differs from debug
cargo +nightly miri test                   # only for crates containing unsafe code
rg -c "unsafe" src/                        # count tracked per commit
```

### Output
`c_rust_idioms`.

### Quality Gate
- Every nonzero construct has a row with an example location.
- `cargo clippy --all-targets -- -D warnings` passes on the empty target crate (tools installed; `rustup component add clippy` if not).

---

## Phase 3: Prove Three Rules on Real Code

### Entry Criteria
- Table filled.

### Actions
1. Pick the three most frequent rules. Port each example function following the rule into the target crate's scratch module.
2. Run that behavior's golden records against it with `cargo test --test golden` and `cargo test --release --test golden` filtered to the behavior. Both must pass for `ok` and `error` records; `ub` records must not panic.

### Output
Evidence per rule.

### Quality Gate
- Both debug and release runs pass for the three examples, with output attached.

---

## Worked Example

Illustrative. Source function:
```c
int parse_port(const char *s) {
    int v = 0;
    for (; *s; s++) {
        if (*s < '0' || *s > '9') { errno = EINVAL; return -1; }
        v = v * 10 + (*s - '0');
    }
    if (v > 65535) { errno = ERANGE; return -1; }
    return v;
}
```
Rules applied: NUL-terminated string to `&[u8]`; `errno` to `Result`; signed overflow (flagged UB in the corpus) to `checked_mul`/`checked_add`.
```rust
pub fn parse_port(s: &[u8]) -> Result<u16, PortError> {
    let mut v: i32 = 0;
    for &c in s {
        if !c.is_ascii_digit() { return Err(PortError::Invalid); }
        v = v.checked_mul(10).and_then(|x| x.checked_add(i32::from(c - b'0'))).ok_or(PortError::Range)?;
    }
    u16::try_from(v).map_err(|_| PortError::Range)
}
```
```
$ cargo test --test golden -- B-003 && cargo test --release --test golden -- B-003
test result: ok. 1 passed; 0 failed
test result: ok. 1 passed; 0 failed
```
(The golden test is one test that iterates all B-003 records; 31 records, 4 of them `ub`, mapped to `PortError::Range` with the user's approval.)

---

## Exit Criteria

DONE when platform types and ownership are recorded, every C construct used has a rule with a real example, checks run, and three rules pass golden records in debug and release builds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ownership is unclear from code and comments | **Return**: ask the user or the C maintainers; guessing ownership produces double frees at the FFI boundary. |
| Phase 1 | c2rust fails on the codebase | **Adjust**: skip the reference translation; it is optional. |
| Phase 2 | A construct needs `unsafe` outside FFI | **Adjust**: isolate it in one module with a `// SAFETY:` comment per block and run Miri on it. |
| Phase 3 | Debug passes, release fails (or the reverse) | **Stop**: an overflow or shift rule is missing; return to `integer_findings`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
