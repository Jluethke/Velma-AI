# Retryability Table

**One-line description:** Produces a per-call-site retry policy that says exactly which errors are retried, at which single layer, only for idempotent operations, with exponential backoff and full jitter, honoring `Retry-After`, and with the attempt count taken from the user rather than invented.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `boundary_map` (object, required): From `errh-boundary-map`.
- `max_attempts` (integer, optional): Total attempts per operation, including the first. If absent, this flow records it as an open question and does not pick a number.

---

## Outputs

- `retry_policy_table` (object[]): One row per outbound call site: `{ call_site, operation, idempotent, retry_layer, retry_on: [classes or codes], give_up_on, max_attempts, backoff: "exponential_full_jitter", honors_retry_after, library }`.

---

## Phase 1: Find Outbound Calls and Existing Retries

### Entry Criteria
- `error_taxonomy` has a `dependency_transient` class.

### Actions
1. List outbound calls with ripgrep: HTTP clients (`requests\.`, `httpx\.`, `aiohttp`, `http\.NewRequest`, `reqwest::`, `fetch\(`, `axios\.`), database calls, queue publishes, gRPC stubs.
2. List existing retry code: `rg -n "tenacity|@retry|backoff\.|retry\(|Retry\(|for attempt|for i := 0; i < .*retr|p-retry|backon|tokio_retry|urllib3\.util\.Retry"`.
3. For each outbound call, record every layer that retries it today: application loop, client library (`urllib3.Retry`, AWS SDK retry mode, gRPC service config `retryPolicy`), service mesh or proxy (Envoy `retry_policy`, Istio `VirtualService.retries`). Read each config file; do not assume.

### Output
Call sites with their current retry layers.

### Quality Gate
- Every outbound call site has a `file:line` and a list of retry layers (possibly empty).
- Each library-level retry cites the config line that enables it.

---

## Phase 2: Decide per Call Site

### Entry Criteria
- Call site list complete.

### Actions
1. Set `idempotent` with this table (RFC 9110 section 9.2.2 defines GET, HEAD, OPTIONS, TRACE, PUT and DELETE as idempotent methods):

| Operation | idempotent |
|---|---|
| HTTP GET, HEAD, OPTIONS, PUT, DELETE | yes |
| HTTP POST or PATCH with an `Idempotency-Key` the server documents support for | yes |
| HTTP POST or PATCH otherwise | no |
| SQL read-only transaction | yes |
| SQL write transaction failed with SQLSTATE 40001 or 40P01 | yes, but retry the whole transaction from `BEGIN`, never one statement |
| Queue publish without deduplication id | no |
| gRPC method marked idempotent in its service config | yes |

2. Apply the retry rule:

| Condition | Decision |
|---|---|
| `idempotent` is no | do not retry; surface the error |
| class is `dependency_transient` and idempotent | retry |
| class is `rate_limited` | retry only after the `Retry-After` delay (RFC 9110 section 10.2.3: seconds or an HTTP-date) |
| gRPC `UNAVAILABLE` | retry |
| gRPC `DEADLINE_EXCEEDED` | retry only if idempotent and the overall deadline still has time left |
| gRPC `ABORTED` | retry at the transaction level (gRPC status code docs) |
| any other class | do not retry |
| `cancelled` | never retry |

3. Pick exactly one `retry_layer` per call site: the layer closest to the failing dependency that knows idempotency. Remove the others in the change plan. Retrying at several layers multiplies attempts (Google SRE book, chapter "Handling Overload").
4. `backoff`: exponential with full jitter (AWS Architecture Blog, "Exponential Backoff and Jitter"). The base delay and cap are user inputs; if absent, list them as open questions.
5. `max_attempts`: copy the input. If absent, write `"OPEN: owner must set"`.
6. `library`, one per stack: python `tenacity` (`stop_after_attempt`, `wait_random_exponential`, `retry_if_exception_type`); go `github.com/cenkalti/backoff` (check the major version in `go.mod`); rust `backon`; typescript `p-retry` (throw `AbortError` to stop retrying). Confirm each function name in the library docs before writing code.

### Output
`retry_policy_table` draft.

### Quality Gate
- No row has `idempotent: no` with a non-empty `retry_on`.
- Every row has exactly one `retry_layer`.
- No numeric delay or attempt count appears unless it came from user input or is marked `OPEN`.

---

## Phase 3: Emit and Flag

### Entry Criteria
- Draft complete.

### Actions
1. Emit `retry_policy_table`.
2. List every call site that currently retries at more than one layer as a `stacked_retry` finding with the layers named.
3. List every non-idempotent call that is retried today as a `unsafe_retry` finding.

### Output
`retry_policy_table`.

### Quality Gate
- `stacked_retry` and `unsafe_retry` lists are present (possibly empty).

---

## Worked Example

Illustrative. `max_attempts=4`. Python service calls `POST /charges` on a payment API (documents `Idempotency-Key`) and `GET /rates`.

Phase 1: `app/pay.py:30` uses `httpx` with a `tenacity` decorator, and `infra/envoy.yaml:88` sets `retry_on: 5xx` for the same cluster. Both layers retry.

Phase 2 rows:
```
app/pay.py:30  POST /charges  idempotent=yes (Idempotency-Key sent)  retry_layer=app (tenacity)
  retry_on=[dependency_transient, rate_limited]  max_attempts=4  honors_retry_after=yes
app/rates.py:12 GET /rates  idempotent=yes  retry_layer=app  max_attempts=4
```
Phase 3: `stacked_retry`: `app/pay.py:30` (tenacity plus Envoy `retry_on: 5xx`): with both at 4 attempts the upstream can see up to 16 requests.

---

## Exit Criteria

DONE when every outbound call has one retry layer or an explicit no-retry decision, and stacked or unsafe retries are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Proxy or mesh config not in the repo | **Return**: mark the layer `unknown` and ask the platform owner; do not assume none. |
| Phase 2 | Unclear whether the upstream honors `Idempotency-Key` | **Adjust**: treat as non-idempotent until the upstream docs confirm support. |
| Phase 2 | User asks for a default attempt count | **Return**: record it as an open question; do not invent one. |
| Phase 3 | Same call retried by both client SDK and app | **Adjust**: disable the SDK retry in config or remove the app loop; keep one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
