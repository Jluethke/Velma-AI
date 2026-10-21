# Rust Failure-Path Tests

**One-line description:** Writes Rust tests that force each error variant through trait-object or generic fakes, assert variants with `matches!` and walk `source()` to prove the cause is kept, check HTTP problem responses with `tower::ServiceExt::oneshot`, assert one boundary log event with `tracing-test`, and prove each test live by breaking the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Workspace root.
- `rust_error_changes` (object, required): From `errh-rust-thiserror-anyhow`.
- `rust_http_error_mapping` (object, required): From `errh-rust-axum-problem-details`.
- `retry_policy_table` (object[], required): From `errh-retryability-table`.
- `test_command` (string, required): Usually `cargo test --all-targets`.

---

## Outputs

- `rust_failure_tests` (object): `{ test_files, cases, mutation_checks, final_summary }`.

---

## Phase 1: Seams and Helpers

### Entry Criteria
- Code under test takes dependencies as a trait (`&dyn Store`, `Arc<dyn Store>`, or a generic `S: Store`).

### Actions
1. If a dependency is a concrete type, add a trait with only the methods used, implemented for the real type; one module, tests green.
2. Write a fake that returns queued results:
```rust
struct FakeStore { results: Mutex<VecDeque<Result<Invoice, sqlx::Error>>>, calls: AtomicUsize }
#[async_trait::async_trait] // or native async fn in traits (Rust 1.75+) if the trait is not used as dyn
impl Store for FakeStore {
    async fn load(&self, _id: u64) -> Result<Invoice, sqlx::Error> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        self.results.lock().unwrap().pop_front().expect("fake ran out of results")
    }
}
```
3. Add `tracing-test` as a dev-dependency for log assertions: `cargo add --dev tracing-test`. Its `#[traced_test]` attribute and `logs_contain` function are documented in the crate docs; confirm for your version.

### Output
Fakes and dev-dependencies.

### Quality Gate
- `cargo test --no-run` compiles.

---

## Phase 2: Write Cases

### Entry Criteria
- Compiles.

### Actions
1. Variant and cause:
```rust
#[tokio::test]
async fn row_not_found_maps_to_not_found() {
    let store = FakeStore::with(vec![Err(sqlx::Error::RowNotFound)]);
    let err = load(&store, 9).await.unwrap_err();
    assert!(matches!(err, InvoiceError::NotFound { id: 9 }), "got {err:?}");
}

#[tokio::test]
async fn db_error_keeps_source() {
    let store = FakeStore::with(vec![Err(sqlx::Error::PoolTimedOut)]);
    let err = load(&store, 9).await.unwrap_err();
    let src = std::error::Error::source(&err).expect("source kept");
    assert!(src.downcast_ref::<sqlx::Error>().is_some());
}
```
2. anyhow at the binary level: `assert!(err.downcast_ref::<InvoiceError>().is_some())` and `assert!(format!("{err:#}").contains("load invoice 9"))`.
3. HTTP: reuse the `oneshot` pattern from `errh-rust-axum-problem-details`, one case per problem type, comparing to fixtures.
4. Retry: queue transient errors then `Ok`; assert `calls` equals `max_attempts` from `retry_policy_table` (skip with `#[ignore = "max_attempts OPEN"]` if open; do not invent). Pause time with `tokio::time::pause()` (requires tokio's `test-util` feature) so backoff does not sleep for real.
5. Log once: annotate the 500 test with `#[traced_test]` and assert `logs_contain("request failed")`; for an exact count use the `logs_assert` closure the crate provides and count matching lines.
6. Panic: request a route that panics in a test-only router and assert a 500 problem.

### Output
Tests.

### Quality Gate
- `cargo test` shows the new tests in `test result: ok.` with no `FAILED` lines.
- `rg -n "#\[ignore" <new files>` lists only `max_attempts OPEN` cases.

---

## Phase 3: Prove Tests Are Live

### Entry Criteria
- Tests pass.

### Actions
1. For each case, break, run `cargo test <test_name>`, confirm failure, restore with `git checkout -- <file>`:
   - variant case: map `RowNotFound` to `Db`.
   - cause case: replace `source` with a new error that drops the original.
   - HTTP case: change one status in `classify`.
   - log case: remove the `tracing::error!` call.
2. `git status --porcelain` shows only intended files.

### Output
`rust_failure_tests`.

### Quality Gate
- Every case recorded with `failed_as_expected: true`.
- Final `test_command` passes; summary recorded.

---

## Worked Example

Illustrative.
```
$ cargo test -p billing invoice::tests
test invoice::tests::row_not_found_maps_to_not_found ... ok
test invoice::tests::db_error_keeps_source ... ok
test result: ok. 2 passed; 0 failed
# break: map RowNotFound to Db
$ cargo test -p billing row_not_found_maps_to_not_found
thread '...' panicked at src/invoice/tests.rs:12:5:
got Db { id: 9, source: RowNotFound }
test result: FAILED. 0 passed; 1 failed
$ git checkout -- src/invoice/repo.rs
```

---

## Exit Criteria

DONE when every variant that reaches a caller or handler has a passing test, causes are proven kept, logs are counted, and each test failed under its break.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Trait is used as `dyn` with async methods | **Adjust**: use `async-trait` (already a common dependency) or return boxed futures; native async trait methods are not dyn-compatible. |
| Phase 2 | `tokio::time::pause` panics | **Adjust**: enable tokio `test-util` in dev-dependencies and use a current-thread runtime (`#[tokio::test]` default). |
| Phase 2 | Error type is not `PartialEq` | **Adjust**: use `matches!`; do not derive `PartialEq` on errors only for tests when sources are not comparable. |
| Phase 3 | Test passes after the break | **Stop**: strengthen the assertion first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
