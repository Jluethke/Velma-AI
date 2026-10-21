# SDK WireMock Fault Tests

**One-line description:** Runs WireMock standalone in Docker to inject faults a spec-driven mock cannot (connection resets, malformed chunks, slow responses, 503-then-200 sequences via scenarios) and verifies through the `__admin` API that the SDK's retries, timeouts and idempotency keys behave correctly on the wire, for any SDK language.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; picks the operations to fault.
- `retry_policy` (object, required): Output of `sdk-retry-backoff`; expected attempt counts.
- `idempotency_design` (object, required): Output of `sdk-idempotency-keys`; expected header reuse.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `fault_test_report` (object): WireMock image tag, stub files, each fault scenario with expected and observed request counts, header reuse result, and the test runner result.

---

## Phase 1: Run WireMock With File Stubs

### Entry Criteria
- Docker is available (`docker version` exits 0).

### Actions
1. Create `test/wiremock/mappings/` and `test/wiremock/__files/`.
2. Start with a pinned image tag (not `latest`):
   `docker run -d --rm --name sdk-wiremock -p 8080:8080 -v "$PWD/test/wiremock:/home/wiremock" wiremock/wiremock:<tag>`
3. Probe: `curl -s http://localhost:8080/__admin/mappings` returns JSON with a `mappings` array.

### Output
Running WireMock.

### Quality Gate
- The probe returns JSON (`curl -s http://localhost:8080/__admin/mappings | jq .meta.total` prints a number).

---

## Phase 2: Write Fault Stubs

### Entry Criteria
- WireMock running.

### Actions
1. 503 then 200 with a scenario (`test/wiremock/mappings/charges-retry.json`):
   ```json
   { "mappings": [
     { "scenarioName": "charge-retry", "requiredScenarioState": "Started", "newScenarioState": "failed-once",
       "request": { "method": "POST", "urlPath": "/v1/charges" },
       "response": { "status": 503, "headers": { "Retry-After": "0" } } },
     { "scenarioName": "charge-retry", "requiredScenarioState": "failed-once",
       "request": { "method": "POST", "urlPath": "/v1/charges" },
       "response": { "status": 201, "jsonBody": { "id": "ch_1" }, "headers": { "Content-Type": "application/json" } } }
   ] }
   ```
2. Connection reset: response `{ "fault": "CONNECTION_RESET_BY_PEER" }`. Other faults: `EMPTY_RESPONSE`, `MALFORMED_RESPONSE_CHUNK`, `RANDOM_DATA_THEN_CLOSE`.
3. Slow response for timeout tests: `"fixedDelayMilliseconds": <value larger than the test client's read timeout>`.
4. Reload after editing files: `curl -X POST http://localhost:8080/__admin/mappings/reset` reloads mappings from disk; `curl -X POST http://localhost:8080/__admin/scenarios/reset` resets scenario states; `curl -X DELETE http://localhost:8080/__admin/requests` clears the request journal.

### Output
Stub files.

### Quality Gate
- `curl -s http://localhost:8080/__admin/mappings | jq '.mappings | length'` equals the number of stubs written.

---

## Phase 3: Run SDK Calls and Verify via the Journal

### Entry Criteria
- Stubs loaded; scenarios and journal reset before each case.

### Actions
1. For each case, call the SDK with base URL `http://localhost:8080` and test-sized timeouts and retries, then verify with the admin API:
   - Count: `curl -s -X POST http://localhost:8080/__admin/requests/count -d '{"method":"POST","url":"/v1/charges"}'` returns `{"count": N}`.
   - Headers: `curl -s http://localhost:8080/__admin/requests | jq -r '.requests[].request.headers["Idempotency-Key"]' | sort -u | wc -l` must print 1 for the retried POST.
   - Unmatched: `curl -s http://localhost:8080/__admin/requests/unmatched | jq '.requests | length'` must print 0.
2. Expected results table:

| Case | Expected count | Expected SDK outcome |
|---|---|---|
| POST with key, 503 then 201 | 2 | Success, one distinct key |
| POST without key, connection reset after send | 1 | `APIConnectionError`, no retry |
| GET, connection reset every time | `max_retries + 1` | `APIConnectionError` |
| GET, `MALFORMED_RESPONSE_CHUNK` | per retry policy row for read errors | Connection error class, not a JSON decode error |
| GET, delay above read timeout | `max_retries + 1` if timeouts are retryable for GET, else 1 | `APITimeoutError` |

3. Automate it as a test file in the SDK's language that starts from reset state and asserts counts through the admin API (an HTTP call from the test).
4. Stop the container: `docker stop sdk-wiremock`.

### Output
`fault_test_report`.

### Quality Gate
- Observed counts equal the table for every case.
- Unmatched request count is 0.
- `docker ps --filter name=sdk-wiremock -q` prints nothing at the end.

---

## Worked Example

Illustrative only. Python SDK, `max_retries = 2` in the test client.

```
$ curl -s -X POST http://localhost:8080/__admin/requests/count -d '{"method":"POST","url":"/v1/charges"}'
{"count":2}
$ curl -s http://localhost:8080/__admin/requests | jq -r '.requests[].request.headers["Idempotency-Key"]' | sort -u | wc -l
1
$ curl -s -X POST http://localhost:8080/__admin/requests/count -d '{"method":"GET","url":"/v1/users/u_1"}'
{"count":3}
```
The `MALFORMED_RESPONSE_CHUNK` case first surfaced `json.JSONDecodeError`; the error mapping was fixed to raise `APIConnectionError` with the cause.

---

## Exit Criteria

DONE when every fault case shows the expected attempt count and SDK error class through the WireMock journal, retried POSTs carry one idempotency key, and no request went unmatched.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docker unavailable | **Adjust**: run the WireMock standalone JAR with Java (`java -jar wiremock-standalone-<version>.jar --port 8080 --root-dir test/wiremock`). |
| Phase 2 | Stub file not loaded | **Adjust**: check JSON validity with `jq empty`, then call `__admin/mappings/reset`. |
| Phase 3 | Counts include previous cases | **Retry**: reset the journal and scenarios, then rerun the case. |
| Phase 3 | Raw library exception escapes | **Return**: send the case to `sdk-error-hierarchy`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
