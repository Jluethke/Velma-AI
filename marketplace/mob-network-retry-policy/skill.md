# Mobile Network Retry and Offline Policy

**One-line description:** Writes a per-endpoint policy that decides, from HTTP semantics (RFC 9110 idempotency, RFC 9111 caching, `Retry-After`), which requests may be retried, how backoff with full jitter is parameterized, what is served from cache while offline, and which writes go to a persisted outbox with an idempotency key, so the platform flows implement rules instead of guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `api_endpoints` (object[], required): Each endpoint's method, path, whether the backend accepts an `Idempotency-Key` header, the `Cache-Control`/`ETag` headers it returns (copy from a real response), and the screen that uses it.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`; the offline states the policy must feed.

---

## Outputs

- `network_policy` (object): Per endpoint: `idempotent`, `retry_on`, `max_attempts`, `backoff_base_ms`, `backoff_cap_ms`, `honor_retry_after`, `timeouts`, `cache_mode`, `offline_behavior` (`serve_cache`, `outbox`, `fail_fast`), plus the source of every number and the list of open questions.

---

## Phase 1: Classify Each Endpoint

### Entry Criteria
- Every entry in `api_endpoints` has a method and path.

### Actions
1. Mark idempotency from RFC 9110 section 9.2.2: `GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE` are idempotent; `POST` and `PATCH` are not.
2. A non-idempotent request becomes retryable only when the backend confirms it deduplicates on an `Idempotency-Key` header (the IETF httpapi draft "The Idempotency-Key HTTP Header Field" describes the pattern). If `api_endpoints` says unknown, record an open question and treat the endpoint as not retryable.
3. Capture real headers for each `GET`:
```bash
curl -sS -D - -o /dev/null -H "Authorization: Bearer $TOKEN" https://api.example.com/v1/orders | grep -iE "cache-control|etag|last-modified|expires|vary"
```
   Record what the server sends. Do not invent a `max-age`.

### Output
Endpoint classification table.

### Quality Gate
- Every endpoint has `idempotent` true/false with the RFC row or backend confirmation cited.
- Every `GET` has its captured cache headers (or "none sent") pasted.

---

## Phase 2: Retry Rules

### Entry Criteria
- Phase 1 complete.

### Actions
1. Apply this table to every endpoint marked retryable:

| Failure | Retry? |
|---|---|
| Connection failed, DNS failure, TLS handshake failure, timeout before any response byte | Yes |
| HTTP 408, 429, 502, 503, 504 | Yes |
| HTTP 500 | Open question for the backend owner; default No |
| Other 4xx (400, 401, 403, 404, 409, 422) | No. 401 goes to the token refresh path, not to retry |
| Request cancelled by the user or by leaving the screen | Never |
| Response body fails to decode | No (a retry returns the same body) |

2. `Retry-After` (RFC 9110 section 10.2.3) on 429 and 503: if present, wait that many seconds (or until that HTTP date) instead of the computed backoff. Record the cap the user accepts for a very large value as an open question.
3. Backoff formula: full jitter, from the AWS Architecture Blog post "Exponential Backoff and Jitter": `sleep = random(0, min(cap, base * 2^attempt))`. `base`, `cap` and `max_attempts` are user inputs. If the project's library has a documented default, you may use it and cite it, for example TanStack Query `retry: 3` and `retryDelay = min(1000 * 2^attempt, 30000)` ms for queries. Do not make up numbers.
4. Timeouts: record the library default and its source (OkHttp connect/read/write 10 s each; `URLSessionConfiguration.timeoutIntervalForRequest` 60 s; `fetch` has none) and whether the user wants a different value.
5. Retries happen in exactly one layer. If the HTTP client already retries (OkHttp `retryOnConnectionFailure`, a dio retry interceptor), record it and do not add a second loop above it; stacked retries multiply attempts.

### Output
Retry fields per endpoint.

### Quality Gate
- Every numeric field cites a user decision or a named library default.
- No endpoint with `idempotent=false` and no confirmed `Idempotency-Key` has `retry_on` non-empty.

---

## Phase 3: Offline Behavior

### Entry Criteria
- Phase 2 complete.

### Actions
1. Reads:

| Condition | `cache_mode` / `offline_behavior` |
|---|---|
| Server sends `Cache-Control`/`ETag` and the data may be shown stale | HTTP cache (RFC 9111) plus `serve_cache` with stale allowed offline |
| Data already persisted in the local database for the screen | `serve_cache` from the database; the network refreshes the table (single source of truth) |
| Data must never be stale (balances, prices at checkout) | `fail_fast`, screen goes to `Error(kind=offline)` |

2. Writes:

| Condition | Behavior |
|---|---|
| User expects it to "go through later" (comment, like, draft save) and endpoint is idempotent or has `Idempotency-Key` | `outbox`: persist the request with a client-generated UUID key, replay in order when connectivity returns |
| Payment, order placement, anything with money or legal effect | `fail_fast` with a clear message; never queue silently |

3. Connectivity signal: do not block a request on a reachability pre-check. Attempt it and classify the failure. Use connectivity callbacks only to trigger replay and `ConnectivityRestored`.
4. Map each policy outcome to a `screen_state_machine` state (`Content(isStale=true)`, `Error(kind=offline)`).

### Output
`network_policy`.

### Quality Gate
- Every endpoint has exactly one `offline_behavior`.
- Every `outbox` endpoint names its idempotency key source.
- `python -m json.tool network_policy.json` exits 0.

---

## Worked Example

Illustrative only. Endpoints: `GET /v1/orders` (server sends `Cache-Control: private, max-age=60`, `ETag`), `POST /v1/orders/{id}/cancel` (backend confirms `Idempotency-Key` support), `POST /v1/checkout` (no key support).

Phase 1: orders GET idempotent; cancel POST retryable by key; checkout POST not retryable.

Phase 2: user chose `base=500 ms`, `cap=8000 ms`, `max_attempts=4`; OkHttp default timeouts kept and cited; `retryOnConnectionFailure` left at default and recorded, app retry loop only handles HTTP 408/429/502/503/504.

Phase 3: orders: `serve_cache` from Room table; cancel: `outbox` with UUID key; checkout: `fail_fast`. Open question logged: "Cap on Retry-After before giving up?"

---

## Exit Criteria

DONE when every endpoint has idempotency, retry triggers, sourced numbers, one offline behavior, and a mapped screen state, with unresolved values listed as open questions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot reach the API to capture headers | **Adjust**: ask the user for a saved response (HAR or proxy capture); do not assume headers. |
| Phase 1 | Backend team cannot confirm idempotency key support | **Adjust**: mark not retryable and log an open question. |
| Phase 2 | User declines to choose backoff numbers and the library has no default | **Return**: list the open question; leave the field null. |
| Phase 3 | A money-moving write was requested as `outbox` | **Stop**: record it as a product decision for the user; do not queue it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
