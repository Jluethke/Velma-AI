# API Integration Planner

Plan and implement API integrations end-to-end: discover endpoints and auth requirements, design the integration architecture, generate production-ready client code with error handling, validate against sandbox environments, and harden with circuit breakers, caching, and monitoring.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DISCOVER   --> Read API docs, identify endpoints needed, auth requirements
PHASE 2: DESIGN     --> Plan integration architecture (direct calls vs SDK vs queue)
PHASE 3: IMPLEMENT  --> Generate client code with error handling, retries, rate limiting
PHASE 4: VALIDATE   --> Test against sandbox/mock, verify error cases
PHASE 5: HARDEN     --> Add circuit breakers, caching, fallback strategies, monitoring
```

## Inputs

- `api_docs`: string -- API documentation URL, OpenAPI spec, or description of available endpoints
- `integration_requirements`: string -- What your application needs from this API (data to read, actions to perform)
- `tech_stack`: string (optional) -- Your application's language and framework for code generation
- `existing_integrations`: string (optional) -- Other APIs already integrated (for consistency)
- `api_schema_cache`: object (optional) -- Previously discovered API schemas for change detection

## Outputs

- `api_discovery_report`: object -- Endpoints needed, auth flow, rate limits, data models, API quirks
- `integration_design`: object -- Architecture decision (direct/SDK/queue), data flow, error strategy
- `client_code`: object -- Production-ready API client with all error handling
- `validation_results`: object -- Test results against sandbox, error case verification
- `hardening_plan`: object -- Circuit breaker config, cache strategy, fallback behavior, monitoring alerts

---

## Execution

### Phase 1: DISCOVER -- Understand the API

**Entry criteria:** API documentation or description is provided. Integration requirements state what data/actions are needed.

**Actions:**

1. **Identify required endpoints:**
   - For each integration requirement, find the API endpoint(s) that fulfill it
   - Record per endpoint: HTTP method, path, parameters (query, path, body, headers)
   - Record response format: status codes, response body schema, pagination format
   - Note: which endpoints are read-only vs write, which are idempotent

2. **Map authentication requirements** (see Reference: Auth Flow Patterns):
   - Auth type: API key, OAuth2, JWT, Basic Auth, HMAC, mTLS
   - Token lifecycle: how to obtain, how to refresh, when it expires
   - Scopes/permissions: what scopes are needed for each endpoint
   - Rate limits per auth level (authenticated vs anonymous, free vs paid tier)

3. **Identify API constraints:**
   - **Rate limits**: requests per second/minute/hour, per endpoint or global
   - **Pagination**: cursor-based, offset-based, page-based, or none
   - **Webhooks**: push notifications available? Signature verification?
   - **Versioning**: URL path (`/v2/`), header (`Accept: application/vnd.api.v2+json`), query param
   - **Data limits**: max request body size, max response size, max query results

4. **Detect API quirks:**
   - Inconsistent error formats across endpoints
   - Endpoints that return 200 with error in body (instead of proper HTTP status)
   - Fields that are documented as required but actually optional (or vice versa)
   - Undocumented rate limits or throttling behavior
   - Date/time format inconsistencies (ISO 8601 vs Unix timestamp vs custom)

5. **Build data model map:**
   - List all data models returned by needed endpoints
   - Map relationships between models (e.g., Order has many LineItems, LineItem references Product)
   - Identify fields you need vs fields you can ignore
   - Note: nullable fields, deprecated fields, fields with enum values

**Output:** API discovery report: endpoints needed with full specs, auth flow, rate limits, pagination, quirks, and data model map.

**Quality gate:** Every integration requirement maps to at least one endpoint. Auth flow is fully documented (obtain + refresh + expire). Rate limits are identified (or marked as "undocumented -- need to discover empirically").

---

### Phase 2: DESIGN -- Plan Integration Architecture

**Entry criteria:** API discovery report is complete.

**Actions:**

1. **Choose integration pattern** (see Reference: Integration Pattern Decision Matrix):

   - **Direct HTTP calls**: Best for simple integrations (<5 endpoints), low call volume, synchronous workflows
   - **SDK/client library**: Best when official SDK exists and is well-maintained. Saves time on auth, serialization, error handling
   - **Queue-based**: Best for high volume, async processing, or when API has strict rate limits. Your app publishes to queue, worker processes at API's pace
   - **Webhook receiver**: Best when API pushes events to you (payment confirmations, status updates). You expose an endpoint, API calls you

2. **Design data flow:**
   - Request path: your code -> (cache check) -> (rate limiter) -> HTTP call -> (retry logic) -> response
   - Response handling: parse -> validate against expected schema -> transform to your domain model -> return
   - Error path: HTTP error -> classify (retryable vs fatal) -> retry or fail -> report

3. **Design error handling strategy:**
   - **Retryable errors**: 429 (rate limited), 500, 502, 503, 504, network timeouts, connection refused
   - **Non-retryable errors**: 400 (bad request), 401 (auth failed -- refresh token first), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation)
   - **Retry policy**: exponential backoff with jitter, max 3 retries, respect Retry-After header
   - **Timeout policy**: connect timeout (5s), read timeout (30s), total timeout (60s)

4. **Design data consistency:**
   - Idempotency: for write operations, use idempotency keys to prevent duplicates
   - Ordering: if processing events, how to handle out-of-order delivery
   - Conflict resolution: what happens if API state and local state diverge

5. **Plan for API evolution:**
   - How will you detect breaking changes? (schema validation, integration tests)
   - Versioning strategy: pin to a version, or follow latest?
   - Deprecation handling: alert when deprecated fields are used in responses

**Output:** Integration design document: pattern choice with justification, data flow diagram, error handling strategy, consistency approach, evolution plan.

**Quality gate:** Pattern choice is justified based on call volume, complexity, and sync/async needs. Error handling classifies every HTTP status code. Retry policy has a max retry count and uses backoff.

---

### Phase 3: IMPLEMENT -- Generate Client Code

**Entry criteria:** Integration design is approved.

**Actions:**

1. **Generate the API client class:**
   ```
   Structure:
   - Constructor: base URL, auth credentials, timeout config
   - Auth method: obtain/refresh token
   - Request method: unified HTTP request with retries, rate limiting, logging
   - Per-endpoint methods: typed parameters, typed returns, docstrings
   - Error classes: specific exception per error type
   ```

2. **Implement authentication:**
   - Token storage (in-memory with expiry tracking)
   - Automatic token refresh before expiry (not after -- proactive refresh)
   - Thread-safe token access (if multi-threaded)
   - Auth header injection on every request

3. **Implement retry logic** (see Reference: Retry with Exponential Backoff):
   - Classify response: success, retryable error, fatal error
   - On retryable error: wait (base_delay * 2^attempt + random jitter), retry
   - On 429: use Retry-After header if present, otherwise backoff
   - Max retries: 3 for idempotent requests, 0 for non-idempotent (unless idempotency key is provided)

4. **Implement rate limiting:**
   - Client-side rate limiter: token bucket or sliding window
   - Track remaining quota from response headers (X-RateLimit-Remaining)
   - Pre-emptive throttling: slow down before hitting the limit, not after

5. **Implement pagination handling:**
   - Auto-paginate: iterator/generator that fetches next page transparently
   - Support both: fetch-all (for small datasets) and stream (for large datasets)
   - Handle: empty pages, last page detection, cursor expiry

6. **Implement request/response logging:**
   - Log: method, URL, status, latency, request ID (for debugging)
   - Do NOT log: auth tokens, API keys, request bodies with PII
   - Structured logging format for easy querying

**Output:** Complete API client code with auth, retries, rate limiting, pagination, and logging.

**Quality gate:** Every endpoint method has typed parameters and return type. Error handling covers all classified error types. Rate limiting is client-side (don't rely solely on server rejections). Secrets are not hardcoded.

---

### Phase 4: VALIDATE -- Test the Integration

**Entry criteria:** Client code is generated.

**Actions:**

1. **Test against sandbox/mock:**
   - If sandbox environment exists: run actual API calls against it
   - If no sandbox: create mock server that mimics the API responses
   - Verify: correct request format (headers, body, query params)
   - Verify: correct response parsing (all fields mapped correctly)

2. **Test error scenarios:**
   - Simulate 401: verify token refresh and retry
   - Simulate 429: verify backoff and Retry-After handling
   - Simulate 500: verify retry with backoff
   - Simulate timeout: verify timeout handling and retry
   - Simulate malformed response: verify graceful error (not crash)
   - Simulate network failure: verify connection error handling

3. **Test pagination:**
   - Empty result set (0 items)
   - Single page (items < page size)
   - Multiple pages (items > page size)
   - Last page detection

4. **Test idempotency:**
   - Send the same write request twice with the same idempotency key
   - Verify: only one resource created, second request returns the same result

5. **Verify data mapping:**
   - Response fields map correctly to your domain model
   - Nullable fields handled (no crash on null)
   - Date/time parsing matches expected timezone handling
   - Numeric precision maintained (no float rounding issues on currency)

**Output:** Validation results: test pass/fail for each scenario, issues found, data mapping verification.

**Quality gate:** All happy-path tests pass. All error scenario tests pass (errors are handled, not crashed). Pagination works for 0, 1, and N pages. Idempotency is verified for write operations.

---

### Phase 5: HARDEN -- Production Readiness

**Entry criteria:** Validation passes all scenarios.

**Actions:**

1. **Add circuit breaker** (see Reference: Circuit Breaker Pattern):
   - Closed (normal): requests pass through
   - Open (failing): requests fail immediately without calling API (after N consecutive failures)
   - Half-open (testing): allow one request through to test if API recovered
   - Configure: failure threshold (5), reset timeout (30s), half-open max requests (1)

2. **Add caching layer:**
   - Identify cacheable endpoints (GET requests that don't change frequently)
   - Cache strategy: TTL-based (for stable data), invalidation-based (for frequently updated data)
   - Cache key: endpoint + parameters hash
   - Stale-while-revalidate: serve stale cache while fetching fresh data in background
   - Cache bypass: allow forced refresh for debugging

3. **Add fallback strategies:**
   - If API is down: serve cached data (with staleness warning)
   - If API is slow: serve cached data, fire background refresh
   - If API returns unexpected data: log, alert, return safe default
   - If quota exhausted: queue requests for later processing

4. **Add monitoring and alerting:**
   - Metrics: request count, error rate, latency p50/p95/p99, rate limit remaining
   - Alerts: error rate > 5% for 5 minutes, latency p95 > 10s, rate limit < 10%
   - Dashboard: real-time view of API health from your client's perspective
   - Log correlation: trace ID through request -> API call -> response for debugging

5. **Document operational runbook:**
   - How to rotate API credentials
   - How to handle API outages (manual fallback procedures)
   - How to debug integration failures (where to look, what to check)
   - How to handle API version upgrades

**Output:** Hardening plan with circuit breaker configuration, cache strategy, fallback behaviors, monitoring setup, and operational runbook.

**Quality gate:** Circuit breaker has specific thresholds (not just "add a circuit breaker"). Cache strategy specifies TTLs per endpoint. Fallback behavior is defined for every failure mode. Monitoring covers latency, errors, and quota.

---

## Exit Criteria

The skill is DONE when:
- Every integration requirement maps to a specific endpoint with full specs
- Integration pattern is chosen and justified
- Client code handles auth, retries, rate limiting, and pagination
- All error scenarios are tested (401, 429, 500, timeout, malformed response)
- Circuit breaker, caching, and fallback strategies are configured
- Monitoring and alerting cover latency, errors, and quota
- An operational runbook exists for credential rotation and outage handling

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| DISCOVER | API documentation is incomplete or outdated | **Adjust** -- use API explorer/sandbox to discover undocumented behavior, note gaps |
| DISCOVER | API requires approval/onboarding before access | **Abort** -- document what's needed for access, provide application template |
| DESIGN | No sandbox environment available for testing | **Adjust** -- create mock server from API docs, note that real API testing is deferred |
| DESIGN | Rate limits are too restrictive for use case | **Adjust** -- design queue-based pattern with batch processing to stay within limits |
| IMPLEMENT | Official SDK exists but is buggy or outdated | **Adjust** -- generate custom client, document SDK issues for potential contribution |
| VALIDATE | Sandbox behavior differs from production | **Escalate** -- document discrepancies, recommend gradual production rollout with monitoring |
| HARDEN | Cannot add circuit breaker (architectural constraint) | **Adjust** -- implement timeout + retry as minimum hardening, document circuit breaker as future work |
| ACT | User rejects the integration architecture or requests significant changes | **Adjust** -- incorporate specific feedback (e.g., different integration pattern, revised retry policy, alternative caching strategy) and regenerate the affected phases; do not restart from Phase 1 unless the API documentation or integration requirements were wrong |
| ACT | User rejects final output | **Targeted revision** -- ask which integration pattern, error handling strategy, or endpoint mapping fell short and regenerate only those affected phases. Do not restart from Phase 1. |

## State Persistence

Between runs, this skill saves:
- **API schema cache**: endpoint specs, data models, auth requirements (for change detection)
- **Breaking change log**: schema differences between runs (new required fields, removed endpoints)
- **Rate limit observations**: actual rate limits observed vs documented
- **Error pattern history**: common failure modes for this API (for faster debugging)

---

## Reference

### Auth Flow Patterns

#### API Key
```
Simplest auth. Key sent as header or query parameter.

Header:  Authorization: Bearer <api_key>
    or:  X-API-Key: <api_key>
Query:   ?api_key=<key>  (AVOID -- keys leak in logs and referrer headers)

Security:
- Store key in environment variable, never in code
- Rotate regularly (every 90 days minimum)
- Use separate keys for dev/staging/prod
```

#### OAuth 2.0 Authorization Code
```
For user-facing apps where you access the API on behalf of a user.

1. Redirect user to:  GET /authorize?client_id=X&redirect_uri=Y&scope=Z&state=RANDOM
2. User grants access, redirected to:  GET /callback?code=AUTH_CODE&state=RANDOM
3. Exchange code for token:  POST /token {grant_type: authorization_code, code: AUTH_CODE}
4. Response:  {access_token, refresh_token, expires_in}
5. Use token:  Authorization: Bearer <access_token>
6. Refresh:  POST /token {grant_type: refresh_token, refresh_token: RT}

Critical: Validate `state` parameter to prevent CSRF.
Critical: Store refresh tokens securely (encrypted at rest).
```

#### OAuth 2.0 Client Credentials
```
For server-to-server auth (no user involved).

1. POST /token {grant_type: client_credentials, client_id: X, client_secret: Y, scope: Z}
2. Response:  {access_token, expires_in}  (no refresh token -- just re-auth)
3. Use token:  Authorization: Bearer <access_token>

Proactive refresh: re-authenticate when token has <10% of its lifetime remaining.
```

#### JWT (Self-signed)
```
For APIs that trust your signature.

1. Build payload:  {iss: "your-app", sub: "user-id", exp: now+3600, aud: "api.example.com"}
2. Sign with your private key:  jwt.encode(payload, private_key, algorithm="RS256")
3. Send:  Authorization: Bearer <signed_jwt>
4. API verifies signature with your public key

Key rotation: maintain two key pairs during rotation, sign with new, verify with both.
```

### Retry with Exponential Backoff

```python
import random
import time

def retry_with_backoff(func, max_retries=3, base_delay=1.0, max_delay=60.0):
    """
    Retry a function with exponential backoff and jitter.

    Delay pattern: 1s, 2s, 4s (with random jitter up to +50%)
    """
    for attempt in range(max_retries + 1):
        try:
            return func()
        except RetryableError as e:
            if attempt == max_retries:
                raise

            # Check for Retry-After header
            if hasattr(e, 'retry_after') and e.retry_after:
                delay = e.retry_after
            else:
                # Exponential backoff with jitter
                delay = min(base_delay * (2 ** attempt), max_delay)
                delay += random.uniform(0, delay * 0.5)  # Add up to 50% jitter

            time.sleep(delay)

# What is jitter and why?
# Without jitter: 1000 clients all retry at exactly 2s, causing a thundering herd
# With jitter: 1000 clients retry between 2.0-3.0s, spreading the load
```

### Circuit Breaker Pattern

```
States:
  CLOSED (normal operation):
    - All requests pass through to the API
    - Track consecutive failures
    - If failures >= threshold: transition to OPEN

  OPEN (API assumed down):
    - All requests fail immediately (no API call)
    - Return cached data or error
    - After reset_timeout: transition to HALF_OPEN

  HALF_OPEN (testing recovery):
    - Allow ONE request through to the API
    - If it succeeds: transition to CLOSED (reset failure counter)
    - If it fails: transition back to OPEN (reset timeout)

Configuration:
  failure_threshold: 5       # consecutive failures before opening
  reset_timeout: 30          # seconds to wait before testing recovery
  half_open_max: 1           # requests to allow in half-open state
  excluded_exceptions: [AuthError]  # don't count auth errors as failures
```

### Integration Pattern Decision Matrix

```
| Factor                  | Direct HTTP | SDK/Library | Queue-Based  | Webhooks    |
|-------------------------|-------------|-------------|--------------|-------------|
| Call volume             | Low (<100/m)| Any         | High (>1K/m) | Event-driven|
| Latency requirement     | Real-time   | Real-time   | Async OK     | Async OK    |
| Rate limits             | Generous    | Handled     | Strict       | N/A (push)  |
| Auth complexity         | Simple      | Handled     | Simple       | Signature   |
| Maintenance burden      | Medium      | Low         | High         | Medium      |
| Control over behavior   | Full        | Limited     | Full         | Limited     |
| Error handling control  | Full        | Limited     | Full         | Must verify |
| Best for                | Prototypes  | Standard    | Bulk ops     | Real-time   |
```

### Common API Integration Mistakes

```
1. Ignoring rate limits until you get 429s in production
   Fix: Read docs, implement client-side rate limiting from day 1

2. Not handling pagination (only getting first page of results)
   Fix: Always check for pagination indicators, iterate all pages

3. Hardcoding base URLs
   Fix: Configuration-driven, different URLs per environment

4. Not logging request IDs for debugging
   Fix: Log the API's request ID from response headers on every call

5. Storing tokens in code or plain-text config
   Fix: Environment variables, secrets manager, encrypted storage

6. Not setting timeouts (hanging forever on a slow API)
   Fix: Always set connect_timeout + read_timeout

7. Retrying non-idempotent requests without idempotency keys
   Fix: Generate and send idempotency keys for POST/PUT/PATCH

8. Not monitoring API health from your side
   Fix: Track error rates, latency, and quota -- alert proactively

9. Trusting API documentation to be accurate
   Fix: Verify with sandbox testing, handle unexpected responses

10. Not planning for API deprecation/versioning
    Fix: Pin to a version, monitor deprecation headers, plan upgrades
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
