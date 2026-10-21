# Rust Result with thiserror and anyhow

**One-line description:** Applies the triage actions to Rust code one module at a time: typed error enums with `thiserror` in library code, `anyhow` with `.context()` in binaries, `?` with `#[from]` conversions, removal of `unwrap`/`expect` on fallible paths, and a source chain that is displayed once without repeated text.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Workspace root containing `Cargo.toml`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.
- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `logging_policy` (object, required): From `errh-log-once-at-boundary`.
- `test_command` (string, required): Usually `cargo test --all-targets`.

---

## Outputs

- `rust_error_changes` (object): `{ crates: [ { name, kind: lib|bin, error_crate } ], enums: [ { name, variants: [ { name, taxonomy_class } ] } ], sites_fixed, test_runs }`.

---

## Phase 1: Choose the Crate per Target

### Entry Criteria
- `cargo --version` and the `thiserror` / `anyhow` versions in `Cargo.lock` recorded (`rg -A1 'name = "(thiserror|anyhow)"' Cargo.lock`).

### Actions
1. Decide with this table:

| Target | Callers need to match on the error? | Use |
|---|---|---|
| library crate (`lib.rs`) | yes, always assume so | `thiserror` enum per module or per crate |
| binary or app top level (`main.rs`, CLI, handlers that only report) | no | `anyhow::Result` with `.context()` |
| HTTP handler layer | yes (to pick a status) | `thiserror` enum `AppError` implementing the framework response trait |

2. Add only what is missing: `cargo add thiserror` and/or `cargo add anyhow`. Do not hand-edit version numbers you have not checked.
3. Define the enum:
```rust
#[derive(Debug, thiserror::Error)]
pub enum InvoiceError {
    #[error("invoice {id} not found")]
    NotFound { id: u64 },
    #[error("invoice {id} was modified concurrently")]
    Conflict { id: u64 },
    #[error("load invoice {id}")]
    Db { id: u64, #[source] source: sqlx::Error },
}
```
4. Chain rule (Rust API guidelines and the `std::error::Error` docs): a variant that exposes an inner error through `source()` must not also print it in its own `Display`. Write `#[error("load invoice {id}")]`, not `#[error("load invoice {id}: {source}")]`; reporters print the chain. `#[error(transparent)]` forwards both `Display` and `source` to the inner error, for pass-through variants only.
5. `#[from]` generates a `From` impl so `?` converts; use it only when one inner type maps to exactly one variant without extra fields.

### Output
Enums and crate choices.

### Quality Gate
- `cargo build --all-targets` exits 0.
- `rg -n '#\[error\("[^"]*\{source\}' --type rust` returns nothing.

---

## Phase 2: Apply Triage Actions per Module

### Entry Criteria
- Builds.

### Actions
1. Take rows for ONE module:

| action | Rust idiom |
|---|---|
| `propagate` | `let row = query(id).await?;` |
| `wrap_with_cause` (lib) | `.map_err(\|source\| InvoiceError::Db { id, source })?` |
| `wrap_with_cause` (bin) | `.with_context(\|\| format!("load invoice {id}"))?` (`anyhow::Context`) |
| `convert_domain` | `match e { sqlx::Error::RowNotFound => InvoiceError::NotFound { id }, other => InvoiceError::Db { id, source: other } }` |
| `return_error` (unwrap/expect) | replace with `?` and change the function to return `Result` |
| `keep_documented` unwrap | keep `expect("<invariant that makes this impossible>")` only for true invariants (for example a regex literal compiled once); the message states the invariant |
| `narrow` (`map_err(\|_\| ...)`) | keep the source: `map_err(\|e\| X { source: e })` |
| `propagate` (`let _ = fallible()`) | handle or `?`; a `let _ =` on a `Result` must have a comment naming why the error is irrelevant |

2. `Option` to error: `.ok_or(InvoiceError::NotFound { id })?` or `.ok_or_else(...)` when building the error allocates.
3. Do not use `Box<dyn std::error::Error>` in library signatures: callers cannot match on it.
4. Panics are for bugs. A panic inside a `tokio::spawn` task surfaces as `JoinError` with `is_panic()`; handle `JoinHandle` results at the task root.
5. Run `cargo test -p <crate>`. Next module only on pass.

### Output
Fixed modules.

### Quality Gate
- `git diff --stat` per step shows one module (plus its tests).
- `cargo test -p <crate>` ends with `test result: ok.`; record it.

---

## Phase 3: Verify Reporting

### Entry Criteria
- All modules done.

### Actions
1. At the binary top level, return `anyhow::Result<()>` from `main`; anyhow prints the chain as `Error: ...` then `Caused by:` lines.
2. For logs, use `{:#}` on `anyhow::Error` (single line chain: `get invoice 9: load invoice 9: no rows returned`) or walk `std::iter::successors(Some(&e as &dyn Error), |e| e.source())` for thiserror types.
3. Set `RUST_BACKTRACE=1` (or `RUST_LIB_BACKTRACE=1`) only in environments where backtraces are wanted; anyhow captures them when enabled (see anyhow docs).
4. Run `test_command` and fill `rust_error_changes`.

### Output
`rust_error_changes`.

### Quality Gate
- `cargo test --all-targets` passes.
- `rg -n "\.unwrap\(\)|\.expect\(" --type rust -g '!**/tests/**' -g '!**/benches/**'` hits are all `keep_documented` rows with an invariant message.

---

## Worked Example

Illustrative. Row: `src/invoice/repo.rs:41 observed=panic` on `.fetch_one(&pool).await.unwrap()`.

After:
```rust
pub async fn load(pool: &PgPool, id: u64) -> Result<Invoice, InvoiceError> {
    sqlx::query_as!(Invoice, "select * from invoice where id = $1", id as i64)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => InvoiceError::NotFound { id },
            source => InvoiceError::Db { id, source },
        })
}
```
```
$ cargo test -p billing invoice::
test result: ok. 14 passed; 0 failed; 0 ignored
```

---

## Exit Criteria

DONE when library errors are typed enums with sources, binaries use anyhow with context, no fallible path panics outside documented invariants, and tests pass per module.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Crate already uses a different error crate (snafu, eyre) | **Adjust**: keep it; apply the same rules with its API from its docs; do not mix two in one crate. |
| Phase 2 | `?` fails with `the trait From<X> is not implemented` | **Adjust**: add a `#[from]` variant or an explicit `map_err`; do not switch the signature to `Box<dyn Error>`. |
| Phase 2 | Changing a public signature breaks dependents | **Adjust**: fix dependents in the same workspace in following steps, one crate each; record semver impact for published crates. |
| Phase 3 | Chain prints the same text twice | **Retry**: remove `{source}` from the outer `#[error]` string. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
