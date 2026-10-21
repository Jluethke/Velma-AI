# Rust axum Problem Details Mapping

**One-line description:** Implements `IntoResponse` for one `AppError` type so axum handlers return `Result<T, AppError>` and every error becomes an RFC 9457 `application/problem+json` response, maps extractor rejections to the validation problem, and catches panics with tower-http's `CatchPanicLayer`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Workspace root.
- `rust_error_changes` (object, required): From `errh-rust-thiserror-anyhow`, or a list of error enums if run standalone.
- `problem_type_registry` (object[], required): From `errh-rfc9457-problem-type-registry`.
- `message_catalog` (object, required): From `errh-user-message-catalog`.
- `test_command` (string, required): Usually `cargo test --all-targets`.

---

## Outputs

- `rust_http_error_mapping` (object): `{ axum_version, app_error_file, variant_to_problem: [ { variant, type, status } ], rejection_handling, panic_layer }`.

---

## Phase 1: Define AppError

### Entry Criteria
- `axum` version recorded from `Cargo.lock`. Code below targets axum 0.7 and 0.8; check the axum changelog for your version's body and extractor APIs.

### Actions
1. Create `src/http/error.rs` with one enum that wraps domain errors:
```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error(transparent)]
    Invoice(#[from] InvoiceError),
    #[error("invalid request")]
    Validation(Vec<FieldError>),
    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}
```
2. Map each variant (and each inner domain variant) to a registry row:

| Variant | status | type |
|---|---|---|
| `Invoice(NotFound)` | 404 | `about:blank` |
| `Invoice(Conflict)` | 409 | conflict |
| `Invoice(Db)` where source is a pool timeout | 503 | temporarily-unavailable |
| `Validation` | 422 | validation-error |
| `Internal` | 500 | `about:blank` |

### Output
`AppError` and mapping table.

### Quality Gate
- Every variant in `rust_error_changes.enums` that can reach a handler appears in the mapping.

---

## Phase 2: Implement IntoResponse, Rejections, Panics

### Entry Criteria
- Mapping fixed.

### Actions
1. Implement:
```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, type_, title) = classify(&self); // the Phase 1 table
        if status.is_server_error() {
            let chain: Vec<String> =
                std::iter::successors(Some(&self as &dyn std::error::Error), |e| e.source())
                    .map(|e| e.to_string())
                    .collect();
            tracing::error!(error = %chain.join(": "), "request failed");
        }
        let body = serde_json::json!({
            "type": type_, "title": title, "status": status.as_u16(),
            "detail": message_for(&self), "trace_id": current_trace_id(),
        });
        (status, [(header::CONTENT_TYPE, "application/problem+json")], body.to_string()).into_response()
    }
}
```
   The chain is walked through `std::error::Error::source()`; because outer `#[error]` strings do not repeat `{source}`, each layer appears once. Log only for 5xx, once, here. Note `#[error(transparent)]` variants forward `source()` to the inner error's source, so the inner message is the first element.
2. Do not use `axum::Json(body)` for the response: it sets `content-type: application/json`. Send the serialized string with the explicit header as above.
3. Extractor rejections (`JsonRejection`, `PathRejection`, `QueryRejection`) return axum's default plain-text 4xx bodies. Convert them: either derive a custom extractor with `#[derive(FromRequest)] #[from_request(via(axum::Json), rejection(AppError))]` and `impl From<JsonRejection> for AppError`, or use `axum_extra::extract::WithRejection<Json<T>, AppError>`. Check the axum docs ("customize-extractor-error" example) for your version.
4. Panics: add `tower_http::catch_panic::CatchPanicLayer::custom(handler)` where `handler` returns the 500 problem. Enable the `catch-panic` feature of `tower-http` (`cargo add tower-http --features catch-panic`).
5. Unmatched routes: `Router::fallback(|| async { AppError::not_found_route() })` so 404s are problems too.
6. Run `test_command`.

### Output
Responses wired.

### Quality Gate
- `cargo build` passes; `rg -n "Json\(.*problem" --type rust` returns nothing (problem bodies are not sent through `Json`).
- `test_command` passes.

---

## Phase 3: Probe with tower::ServiceExt

### Entry Criteria
- Wired.

### Actions
1. Test each mapping row without a server:
```rust
use tower::ServiceExt; // for oneshot
let res = app().oneshot(Request::get("/invoices/9999").body(Body::empty()).unwrap()).await.unwrap();
assert_eq!(res.status(), StatusCode::NOT_FOUND);
assert_eq!(res.headers()[header::CONTENT_TYPE], "application/problem+json");
let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
assert_eq!(v["status"], 404);
```
   `unwrap()` is acceptable in tests.
2. Compare each body with its registry fixture after removing `trace_id` and `instance`.
3. Malformed JSON to a JSON route returns 400 or 422 problem (per registry), not axum's plain text.

### Output
`rust_http_error_mapping`.

### Quality Gate
- `cargo test http::` shows one passing test per mapping row plus rejection, fallback and panic cases.
- No response body contains `panicked at` or `.rs:`.

---

## Worked Example

Illustrative.
```
$ curl -si localhost:3000/invoices -H 'content-type: application/json' -d '{"qty":'
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json

{"type":"https://api.shop.example/problems/validation-error","title":"Your request is not valid.","status":422,"detail":"The request body is not valid JSON.","trace_id":"..."}
```
Before the change the same request returned `content-type: text/plain` with axum's rejection text.

---

## Exit Criteria

DONE when every handler error, extractor rejection, unmatched route and panic yields an RFC 9457 body that matches the registry, verified by `oneshot` tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework is actix-web | **Adjust**: implement `actix_web::ResponseError` (`status_code`, `error_response`) with the same table. |
| Phase 2 | `to_bytes` signature differs | **Adjust**: read the axum version's docs; 0.6 used `hyper::body::to_bytes`. |
| Phase 2 | Error logged by both `IntoResponse` and `TraceLayer` | **Adjust**: configure `TraceLayer` `on_failure` to a lower level or none, per the log-once rule. |
| Phase 3 | Rejection still plain text | **Retry**: the handler still uses `axum::Json<T>` directly; switch it to the custom extractor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
