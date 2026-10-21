# Port Rust Golden Replay

**One-line description:** Builds a Rust integration test that loads the frozen golden JSON Lines corpus with `serde_json`, decodes typed values (`$int` with `i128` or `num-bigint`, `$f64` with `f64::from_bits`, `$bytes`), runs every record and reports all failing record ids in one assertion, and runs in both debug and release profiles because integer overflow behavior differs between them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_repo` (string, required): Path to the Rust crate.
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.

---

## Outputs

- `rust_replay_command` (object): The exact commands: debug and release replay, one behavior, checksum test, Clippy, plus harness file paths.

---

## Phase 1: Copy and Verify the Corpus

### Entry Criteria
- `golden_corpus.tag` exists in the source repository.

### Actions
1. Copy: `git -C <source_repo> archive golden-v1 golden | tar -x -C tests/`.
2. Verify: `(cd tests/golden && sha256sum -c SHA256SUMS)`.
3. Add dev-dependencies: `cargo add --dev serde_json base64 sha2 hex` (and `num-bigint` if any `$int` exceeds the `i128` range; check with `jq -r '.. | objects | select(has("$int")) | ."$int" | length' tests/golden/B-*.jsonl | sort -n | tail -n 1`, where a length above 38 digits may exceed `i128`).

### Output
Corpus in `tests/golden`.

### Quality Gate
- `sha256sum -c SHA256SUMS` exits 0.
- `cargo build --tests` succeeds with the new dev-dependencies.

---

## Phase 2: Write the Harness

### Entry Criteria
- Corpus in place.

### Actions
1. Put the harness in `tests/golden.rs`. Cargo discovers it as the integration test target `golden` (run with `--test golden`). The data directory `tests/golden/` contains no `main.rs`, so Cargo does not treat it as a second target. Read files from `concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/")`.
2. Decoding (`serde_json::Value`):
   - `$int`: `s.parse::<i128>()` then `i64::try_from` or `u64::try_from` for the ported function's parameter type; `try_from` failure is a decode error, never a silent `as` cast.
   - `$f64`: `f64::from_bits(u64::from_str_radix(h, 16)?)`; `"nan"` to `f64::NAN`.
   - `$bytes`: `base64::engine::general_purpose::STANDARD.decode(b)`.
   - `$badstr`: keep as `Vec<u8>` (raw bytes) or `Vec<u16>` (UTF-16 units); Rust `String` cannot hold it. Pass to functions that take `&[u8]`, or expect the function to reject it.
   - Encode results back to the typed form; floats with `format!("{:016x}", x.to_bits())`, NaN as `"nan"`.
3. Registry: `fn registry() -> HashMap<&'static str, fn(&[Value], &Map<String, Value>) -> Result<Value, String>>` where the `Err(String)` is the error category name (each ported error enum implements a `category()` method that matches `categories.json`).
4. The test:
```rust
#[test]
fn golden() {
    let only = std::env::var("GOLDEN_ONLY").ok();
    let mut failures = Vec::new();
    let (mut ran, mut skipped) = (0, 0);
    for rec in load_all() {
        if only.as_deref().is_some_and(|b| b != rec.behavior) { continue; }
        let Some(f) = registry().get(rec.call.as_str()).copied() else { skipped += 1; continue; };
        ran += 1;
        let outcome = std::panic::catch_unwind(|| f(&rec.args, &rec.kwargs));
        if let Err(msg) = compare(&rec, outcome) { failures.push(format!("{}: {}", rec.id, msg)); }
    }
    eprintln!("golden: ran={ran} skipped={skipped} failed={}", failures.len());
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}
```
   - A panic counts as a failure unless the record is `ub` and the user wrote that a panic is acceptable for it (default: not acceptable).
   - Rust's built-in test harness has no per-record test cases; this single test with a collected failure list is the standard pattern. For per-record entries in the test list, the `libtest-mimic` or `datatest-stable` crates exist; check their docs before adopting.
5. `checksum` test: recompute SHA-256 with `sha2::Sha256` per file, compare to `SHA256SUMS`.

### Output
Harness files.

### Quality Gate
- With an empty registry, `cargo test --test golden -- --nocapture` prints `ran=0 skipped=<record count> failed=0`.
- Changing one byte in a copied corpus file makes the checksum test fail; restore with `git checkout -- tests/golden`.

---

## Phase 3: Prove the Comparator, Both Profiles

### Entry Criteria
- Harness runs.

### Actions
1. In a scratch branch, register a stub that computes with plain `+` on an `$int` boundary record that overflows `i32`: `cargo test --test golden` must fail (debug panics with "attempt to add with overflow"), and `cargo test --release --test golden` must also fail (wrong wrapped value). Then a stub returning `0.0` for an expected `-0.0`: must fail. Delete the branch.
2. Record commands. Both profiles are mandatory in every later run.

### Output
`rust_replay_command`.

### Quality Gate
- Both stubs fail in both profiles, with output attached.

---

## Worked Example

Illustrative. C to Rust, `libnetcfg`, 96 records.
```
$ GOLDEN_ONLY=B-003 cargo test --test golden -- --nocapture
golden: ran=31 skipped=65 failed=0
test golden ... ok
$ GOLDEN_ONLY=B-003 cargo test --release --test golden -- --nocapture
golden: ran=31 skipped=65 failed=0
```
`rust_replay_command`:
```
{"debug": "cargo test --test golden -- --nocapture",
 "release": "cargo test --release --test golden -- --nocapture",
 "one_behavior": "GOLDEN_ONLY=B-003 cargo test --test golden -- --nocapture",
 "checksum": "cargo test --test golden checksum",
 "lint": "cargo clippy --all-targets -- -D warnings"}
```

---

## Exit Criteria

DONE when the corpus is in `tests/golden` with verified checksums, the harness reports ran, skipped and failed counts with every failing record id, the comparator catches overflow and `-0.0` in both profiles, and commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Integers exceed `i128` | **Adjust**: add `num-bigint` and decode those parameters as `BigInt`. |
| Phase 2 | `catch_unwind` rejects a closure as not `UnwindSafe` | **Adjust**: wrap with `std::panic::AssertUnwindSafe`; the test process is discarded afterward anyway. |
| Phase 3 | Debug and release give different results for a real port | **Stop**: an overflow is unhandled; use `checked_*` or `wrapping_*` per `integer_findings`. |
| Phase 3 | Someone runs only the debug profile | **Adjust**: both commands are part of the gate; CI runs both. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
