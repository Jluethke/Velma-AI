# TDD HTTP Boundary

**One-line description:** Test-drives code that calls a remote HTTP API by pointing it at an in-process fake server or request interceptor (responses, respx, MSW, httptest, wiremock, WireMock), failing on any unexpected request, and covering success, client error, server error, timeout and malformed-body behaviors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `double_plan` (object[], required): From `tdd-test-double-choice`; rows with role HTTP API and their owned adapters.
- `stack` (string, required): `python`, `node`, `go`, `rust` or `java`.

---

## Outputs

- `http_tests` (object): The base URL or transport seam, the fake-server tool chosen, tests written per case, and the run output.

---

## Phase 1: Seam the Base URL or Transport

### Entry Criteria
- `double_plan.boundaries` contains `http`, or an HTTP API collaborator is listed.

### Actions
1. Find the adapter that makes the HTTP call (from `double_plan`). Its base URL must be a constructor or config parameter, not a constant. Its HTTP client should be injectable too (for timeouts and transports).
2. Read the HTTP client library from the imports: Python `requests` or `httpx`; Node `fetch`, `axios` or `undici`; Go `net/http`; Rust `reqwest`; Java `java.net.http.HttpClient`, OkHttp or Spring `RestClient`/`WebClient`.
3. Make the base URL a parameter (one change), run the full suite, stay green.

### Output
Adapter accepts base URL and client.

### Quality Gate
- `grep -n "https://" <adapter file>` shows no hard-coded production URL except in a default or config file.
- Full suite exit code 0.

---

## Phase 2: Pick and Wire the Fake

### Entry Criteria
- Seam in place.

### Actions
1. Choose the tool by client library:

| stack / client | Tool | Fail on unexpected request |
|---|---|---|
| python `requests` | `responses`: `@responses.activate`, `responses.add(responses.GET, url, json={...}, status=200)` | unmatched calls raise `ConnectionError` by default |
| python `httpx` | `respx`: `respx.get(url).mock(return_value=httpx.Response(200, json={...}))`, or `httpx.MockTransport(handler)` | respx asserts all routes called by default (`assert_all_called`); unmatched raises |
| python any client, real socket | `pytest-httpserver`: `httpserver.expect_request("/v1/x").respond_with_json({...})`, base URL `httpserver.url_for("/")` | `httpserver.check_assertions()` |
| node `fetch`/`axios` | MSW 2: `setupServer(http.get(url, () => HttpResponse.json({...})))` from `msw/node`; `server.listen({ onUnhandledRequest: 'error' })` in `beforeAll`, `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll` | `onUnhandledRequest: 'error'` |
| go `net/http` | `srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {...}))`, `defer srv.Close()`, pass `srv.URL` | in the handler, `t.Errorf` on an unexpected path or method |
| rust `reqwest` | `wiremock`: `let server = MockServer::start().await; Mock::given(method("GET")).and(path("/v1/x")).respond_with(ResponseTemplate::new(200).set_body_json(...)).expect(1).mount(&server).await;` pass `server.uri()` | `.expect(n)` is verified when `server` drops; unmatched requests get 404 |
| java | WireMock: `@WireMockTest` on the class, `stubFor(get("/v1/x").willReturn(okJson("{...}")))`, base URL from `WireMockRuntimeInfo.getHttpBaseUrl()`; or OkHttp `MockWebServer` | `verify(1, getRequestedFor(urlEqualTo("/v1/x")))` |

2. Install only the one tool chosen, as a dev/test dependency. Check the tool's docs for the version installed; the MSW 1 API (`rest.get`) differs from MSW 2 (`http.get`).
3. Never let a unit test reach the real network. Tests must pass with the network disconnected.

### Output
Fake server wired into a test setup.

### Quality Gate
- Unexpected-request handling is set to fail as shown in the table's third column.
- The test file does not contain the production host name.

---

## Phase 3: Drive the HTTP Cases

### Entry Criteria
- Fake wired.

### Actions
1. Write one failing test at a time, for each case the requirement covers:

| Case | Fake returns | Assert |
|---|---|---|
| Success | 200 with a valid body | parsed domain value returned |
| Request shape | 200 | method, path, query, headers (auth), and JSON body the fake received |
| Not found | 404 | the adapter's documented result (None, typed error), not a raw HTTP exception |
| Client error | 400 or 422 with an error body | error carries the API's message |
| Rate limited | 429 with `Retry-After` | behavior from the requirement (retry, surface error) |
| Server error | 500 or 503 | error or retry per requirement |
| Malformed body | 200 with `"not json"` or a missing field | a parse error type, never a crash on `None` |
| Timeout | delay longer than the client timeout (MSW `await delay(ms)`, httptest handler `time.Sleep`, wiremock `set_delay`, WireMock `withFixedDelay`) | timeout error type |

2. Retry counts, backoff delays and timeout values come from the requirement or the API's documentation. When absent, record an open question; do not pick numbers.
3. For the timeout case, set a short client timeout in the test through the injected client, so the test does not wait for a production-length timeout.

### Output
`http_tests`.

### Quality Gate
- With networking disabled (or the production host unresolvable), the HTTP tests pass.
- Each case row the requirement covers has a named test in `http_tests`.

---

## Worked Example

Illustrative only. `stack` = `python`, adapter `RatesClient(base_url, session)` using `httpx`.

```python
import httpx, respx, pytest

@respx.mock
def test_get_rate_returns_decimal_on_200():
    respx.get("https://fake.test/v1/rates/EUR").mock(
        return_value=httpx.Response(200, json={"rate": "1.0842"}))
    client = RatesClient("https://fake.test", httpx.Client())
    assert client.get_rate("EUR") == Decimal("1.0842")

@respx.mock
def test_get_rate_raises_rates_unavailable_on_503():
    respx.get("https://fake.test/v1/rates/EUR").mock(return_value=httpx.Response(503))
    with pytest.raises(RatesUnavailable):
        RatesClient("https://fake.test", httpx.Client()).get_rate("EUR")
```

`python -m pytest tests/test_rates.py -q` shows the second test fail with `httpx.HTTPStatusError` (red), then pass after the adapter maps 503 to `RatesUnavailable`.

---

## Exit Criteria

DONE when the adapter takes its base URL and client as parameters, an in-process fake that fails on unexpected requests is wired, and each required HTTP case has a passing test that never touches the network.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Client created inside a function with no parameter | **Adjust**: add an optional parameter defaulting to the current client; refactor under green. |
| Phase 2 | Interceptor does not catch the call (request goes out) | **Stop**: the client library does not match the tool; pick the row for the actual client. |
| Phase 3 | Timeout test takes as long as the production timeout | **Adjust**: inject a client with a test timeout. |
| Phase 3 | Requirement silent on retry policy | **Return**: record an open question; test only the single-attempt behavior. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
