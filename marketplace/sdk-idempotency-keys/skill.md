# SDK Idempotency Keys

**One-line description:** Adds an `Idempotency-Key` header (IETF draft-ietf-httpapi-idempotency-key-header) to non-idempotent operations that support it, generated once per logical call as a UUID v4 and reused unchanged across every retry attempt, with a caller override, and proves reuse on the wire.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `retry_policy` (object, required): Output of `sdk-retry-backoff`; the retry loop must expose a per-call context where the key lives.
- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `idempotency_header` and the operations declaring it.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `idempotency_design` (object): Header name, operations that send it, generation and reuse rule, caller override name, server responses handled (409, 422), and test results.

---

## Phase 1: Find Supported Operations

### Entry Criteria
- `api_inventory.idempotency_header` is set or marked `unknown`.

### Actions
1. List operations declaring the header: `jq -r '.paths | to_entries[] | .key as $p | .value | to_entries[] | select([.value.parameters[]? | select(.in=="header" and (.name|ascii_downcase)=="idempotency-key")] | length > 0) | "\(.key|ascii_upcase) \($p)"' build/openapi.json`.
2. Decision:

| Case | Action |
|---|---|
| Header declared on the operation, or API docs state support for it | Send a key on every call of that operation |
| Method is POST or PATCH and no support is documented | Do not send a key; the retry policy must not retry these after the request was sent |
| Method is GET, HEAD, OPTIONS, PUT, DELETE | No key needed (idempotent by RFC 9110 section 9.2.2); send only if the API docs require it |

3. Record the server's documented responses for key misuse. The draft specifies 400 for a missing required key, 409 when a request with the same key is still being processed, and 422 when the key is reused with a different payload; confirm in the API's own docs.

### Output
Operation list and response rules.

### Quality Gate
- The jq command ran and every listed operation has a decision row.

---

## Phase 2: Implement

### Entry Criteria
- Operation list exists.

### Actions
1. Generate the key ONCE, before the retry loop, for each logical call: python `str(uuid.uuid4())`, typescript `crypto.randomUUID()` (global in Node 19 and later; `import { randomUUID } from "node:crypto"` otherwise), go `uuid.NewString()` from `github.com/google/uuid`.
2. Store it on the per-call request options, not on the client instance (a client-level key would be reused across different calls and the server would return the first call's response for all of them).
3. Caller override: python keyword `idempotency_key: str | None = None`, typescript `RequestOptions.idempotencyKey`, go option `WithIdempotencyKey(k)`. If supplied, use it verbatim on every attempt.
4. Retry interaction: the retry policy may retry POST/PATCH only when this key is present. Update the retry flow's `is_idempotent` check to read the key from the per-call options.
5. Handle 409 (in progress): treat as retryable under the retry policy's backoff when the docs say so; otherwise raise `ConflictError` with the key attached. Handle 422 (key reused with a different body): raise immediately; never retry.
6. Do NOT derive the key from the request body hash unless the user asks; two intentionally identical payment requests would collapse into one.

### Output
Idempotency implementation.

### Quality Gate
- Type checker passes.
- `grep -n "uuid4\|randomUUID\|uuid.NewString" <transport file>` shows generation outside the retry loop (line number before the loop start).

---

## Phase 3: Prove Reuse on the Wire

### Entry Criteria
- Implementation compiles.

### Actions
1. Test reuse: mock returns 503, 503, 201 for `POST /v1/charges`; capture the `Idempotency-Key` header of each attempt; assert three attempts, all three values equal, and the value is a valid UUID (`uuid.UUID(v, version=4)` in Python, a regex in TypeScript, `uuid.Parse` in Go).
2. Test uniqueness: two separate calls produce two different keys.
3. Test override: caller passes `"order-123"`; every attempt sends exactly that.
4. Test 422: mock returns 422; exactly one attempt and the matching SDK error.
5. Run the suite.

### Output
`idempotency_design`.

### Quality Gate
- All four tests pass.
- Mutation check: move key generation inside the retry loop; Test 1 must fail; restore.

---

## Worked Example

Illustrative only. `stack = python`, header declared on `POST /v1/charges` and `POST /v1/refunds`.

```
$ jq -r '... idempotency-key ...' build/openapi.json
POST /v1/charges
POST /v1/refunds
$ pytest tests/test_idempotency.py -q
....                                                         [100%]
4 passed in 0.05s
$ # mutation: generate key per attempt
$ pytest tests/test_idempotency.py -q -k reuse
E   AssertionError: assert len({'9f1c...', '0b2e...', '77aa...'}) == 1
```

---

## Exit Criteria

DONE when every supporting non-idempotent operation sends one key per logical call, reused across all retries, overridable by the caller, and tests prove reuse, uniqueness, override and the 422 rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Support unknown and docs silent | **Return**: ask the API owner; until answered, send no key and do not retry POST after send. |
| Phase 2 | Generated client builds headers internally | **Adjust**: inject via request editor or middleware that reads the per-call options. |
| Phase 3 | Captured headers differ by case only | **Adjust**: compare header values with case-insensitive header lookup. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
