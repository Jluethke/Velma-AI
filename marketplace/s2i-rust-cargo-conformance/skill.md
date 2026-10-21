# Rust Conformance Suite with cargo-nextest

**One-line description:** Implements the conformance test plan as a Rust integration test crate with requirement IDs in test function names, loads vectors with `serde_json`, and runs it under `cargo nextest` with a JUnit profile that writes `reports/conformance-junit.xml` for the traceability matrix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `conformance_test_plan` (object[], required): From `s2i-conformance-test-design`.
- `test_vectors` (object, required): From `s2i-test-vectors-extract`.
- `project_dir` (string, required): Cargo crate root.

---

## Outputs

- `conformance_tests` (string): Path to `tests/conformance/` (integration tests).
- `junit_report` (string): Path to `reports/conformance-junit.xml`.

---

## Phase 1: Test Crate Setup

### Entry Criteria
- `cargo --version` works; `testdata/vectors.json` exists.

### Actions
1. Add dev dependencies: `cargo add --dev serde --features derive` and `cargo add --dev serde_json`.
2. Create `tests/conformance/main.rs` as one integration test binary with `mod sec_5_1;` style submodules, and register it in `Cargo.toml`:
   ```toml
   [[test]]
   name = "conformance"
   path = "tests/conformance/main.rs"
   ```
3. In `tests/conformance/vectors.rs` load the file with `include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/testdata/vectors.json"))` and deserialize into `struct Vector { id: String, req_ids: Vec<String>, input: String, expected: String, encoding: String }`.
4. Install the runner: `cargo install cargo-nextest --locked`.

### Output
Compiling test crate.

### Quality Gate
- `cargo test --test conformance --no-run` exits 0.
- `cargo nextest --version` prints a version.

---

## Phase 2: Write Tests from the Plan

### Entry Criteria
- Test crate compiles.

### Actions
1. One module per spec section. Finish one module and run it before writing the next.
2. Function names carry the IDs (Rust identifiers cannot contain `.` or `-`, so replace them with `_`): `fn t_5_1_02_01__req_5_1_02()`. Keep the original IDs in a doc comment `/// T-5.1-02-01 REQ-5.1-02` for humans.
3. Vector groups: one test that loops over `vectors("V-5.7")` and collects failures into a `Vec<String>`, then `assert!(failures.is_empty(), "{failures:#?}")`, so one bad vector does not hide the others.
4. Start the server under test on `127.0.0.1:0` (`std::net::TcpListener::bind("127.0.0.1:0")` or `tokio::net::TcpListener`) and pass the listener in; read the port from `local_addr()`.
5. Set `set_read_timeout(Some(timeout))` on every `TcpStream`, with `timeout` from the spec or an environment variable the user sets.
6. Never add `#[ignore]` to hide a failure; `#[ignore = "AMB-nnn ..."]` is allowed only for an unresolved ambiguity.

### Output
`conformance_tests`.

### Quality Gate
- `cargo nextest list --test conformance` lists one entry per plan row or vector group.
- The count of `/// T-` doc comments equals the plan's row count minus vector rows covered by group tests.

---

## Phase 3: Run with JUnit Output

### Entry Criteria
- Tests listed.

### Actions
1. Configure JUnit output in `.config/nextest.toml`:
   ```toml
   [profile.ci.junit]
   path = "junit.xml"
   ```
   nextest writes the file under `target/nextest/ci/`. Confirm the location in the nextest docs ("JUnit support") for your version.
2. Run: `cargo nextest run --test conformance --profile ci --no-fail-fast`.
3. Copy to the shared path: `mkdir -p reports && cp target/nextest/ci/junit.xml reports/conformance-junit.xml`.
4. Read the summary line (`Summary [...] N tests run: P passed, F failed, S skipped`).
5. Rerun one test while fixing: `cargo nextest run --test conformance t_5_1_02_01`.

### Output
`junit_report`.

### Quality Gate
- `reports/conformance-junit.xml` exists and `grep -c 'req_' reports/conformance-junit.xml` is greater than zero.
- The Summary line is copied into the run notes as printed.

---

## Worked Example

Illustrative. RFC 6455 server crate `wsd`.

Phase 2:
```rust
/// T-5.1-03-01 REQ-5.1-03
#[test]
fn t_5_1_03_01__req_5_1_03() {
    let (mut c, srv) = connect_and_handshake();
    srv.send_text("hi");
    let f = read_frame(&mut c);
    assert_eq!(f[1] & 0x80, 0, "server frame must not be masked");
}
```
Phase 3:
```
$ cargo nextest run --test conformance --profile ci --no-fail-fast
    PASS [   0.004s] wsd::conformance sec_5_1::t_5_1_03_01__req_5_1_03
...
     Summary [   1.212s] 59 tests run: 59 passed, 0 skipped
$ cp target/nextest/ci/junit.xml reports/conformance-junit.xml
```

---

## Exit Criteria

DONE when every plan row is a Rust test whose name encodes its requirement IDs, the suite runs under nextest with `--no-fail-fast`, and the JUnit file is at `reports/conformance-junit.xml`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `include_str!` path not found | **Adjust**: use `CARGO_MANIFEST_DIR` as shown; relative paths are relative to the source file. |
| Phase 2 | Lint warns about double underscore in names | **Adjust**: add `#![allow(non_snake_case)]` at the test crate root only if clippy flags it; do not rename away the IDs. |
| Phase 3 | JUnit file not where expected | **Adjust**: check the profile name and the nextest docs for the store directory. |
| Phase 3 | Test fails | **Return** the test ID and requirement to the implementer; leave the test as written. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
