# Network Stub Isolation

**One-line description:** Stops tests from reaching real hosts by blocking outbound sockets per stack (pytest-socket, `nock.disableNetConnect`, msw `onUnhandledRequest: 'error'`, injected Go base URLs) and replacing each real call with a local stub (responses or respx, nock or msw, `httptest.NewServer`), including the IPv6 `localhost` trap on Node 17+.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Network error lines and hosts.
- `flake_class` (string, required): Must be `network`.
- `baseline_command` (string, required): Reproduction.
- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `network_fix_diff` (string): Unified diff with a note per hunk naming the host now stubbed.

---

## Phase 1: Find Every Real Network Call

### Entry Criteria
- `flake_class` is `network`. Otherwise return an empty diff.

### Actions
1. Turn on a network block and let it list the calls:
   - python: `python -m pip install pytest-socket`, then `python -m pytest <selection> --disable-socket --allow-unix-socket -q`. Blocked calls raise `SocketBlockedError`. To allow a local test server, add `--allow-hosts=127.0.0.1,::1`.
   - node (nock): in a setup file listed under `setupFilesAfterEnv`, `nock.disableNetConnect(); nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);` Blocked calls fail with `Nock: Disallowed net connect for "<host>"`. Check the nock major version: older majors do not intercept Node's built-in `fetch` (undici); msw 2 intercepts both `http` and `fetch`.
   - node (msw 2): `server.listen({ onUnhandledRequest: 'error' })` in `beforeAll`, `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll`.
   - go: there is no global switch. Find calls with `grep -rn -E "http\.Get|http\.Post|http\.DefaultClient|&http\.Client|net\.Dial|grpc\.Dial|grpc\.NewClient" <pkg>` and check whether each URL comes from config or a constant.
2. List each host, the code that calls it, and whether the test means to test that integration.

### Output
Host list.

### Quality Gate
- The block run's failures are recorded, one line per host.

---

## Phase 2: Stub Each Host

### Entry Criteria
- Host list exists.

### Actions
1. Choose the stub by client library:

| Stack and client | Stub |
|---|---|
| python `requests` | `responses`: `@responses.activate`; `responses.add(responses.GET, "https://api.example.com/rates", json={...}, status=200)` |
| python `httpx` | `respx`: `respx.get("https://api.example.com/rates").mock(return_value=httpx.Response(200, json={...}))` |
| python, real HTTP server needed | `pytest-httpserver` fixture `httpserver`, pass `httpserver.url_for("/rates")` to the code |
| python, recorded fixtures | `vcrpy` / `pytest-recording` with `--record-mode=none` in CI so a missing cassette fails instead of calling out |
| node `http`/`axios` | `nock('https://api.example.com').get('/rates').reply(200, {...})`; `nock.cleanAll()` in `afterEach` |
| node `fetch` | msw `http.get('https://api.example.com/rates', () => HttpResponse.json({...}))` |
| go `net/http` | `srv := httptest.NewServer(http.HandlerFunc(...))`; `t.Cleanup(srv.Close)`; pass `srv.URL` as the base URL (inject it through the client's config struct) |

2. Stub error paths the flake showed (timeouts, 429, 5xx) as separate explicit tests with the stub returning that status, so the retry or error handling is tested deterministically.
3. Local services in tests (database, Redis started by the suite): connect to `127.0.0.1`, not `localhost`. Node 17+ no longer reorders DNS results to prefer IPv4, so `localhost` may resolve to `::1` first and fail with `connect ECONNREFUSED ::1:<port>` when the service listens only on IPv4.
4. If the test is meant to be a real integration test against a third-party host, it does not belong in the blocking unit suite: move it to a separately triggered job and record that in the diff note.
5. Do NOT add retries around the real call, or raise its timeout, as the fix.

### Output
Stubs in place.

### Quality Gate
- The Phase 1 block run passes with zero blocked-call errors.

---

## Phase 3: Keep The Block On And Diff

### Entry Criteria
- Stubs pass.

### Actions
1. Make the block permanent for the unit suite:
   - python: add `--disable-socket --allow-unix-socket` (and `--allow-hosts` if needed) to `addopts` in the existing pytest config; tests that need sockets use `@pytest.mark.enable_socket`.
   - node: keep `nock.disableNetConnect()` or msw `onUnhandledRequest: 'error'` in the setup file.
   - go: the injection makes real hosts unreachable from tests by construction.
2. Run the test file once with the network disabled at the OS level if available (for example inside `docker run --network none ...`).
3. `git -C <repo_path> diff > flk-net.diff`; copy into `network_fix_diff`; delete it.

### Output
`network_fix_diff`.

### Quality Gate
- `--network none` run (or the block run) exits 0.

---

## Worked Example

Illustrative. Python, `tests/test_fx.py::test_converts_usd_to_eur` failing with `requests.exceptions.ConnectTimeout` to `api.exchangerate.example`.

- Phase 1: `python -m pytest tests/test_fx.py --disable-socket --allow-unix-socket -q` fails with `SocketBlockedError` in `fx.fetch_rate`.
- Phase 2: `@responses.activate` and `responses.add(responses.GET, "https://api.exchangerate.example/latest", json={"EUR": 0.92})`; new test `test_rate_timeout_raises_fx_unavailable` uses `body=requests.exceptions.ConnectTimeout()`.
- Phase 3: `addopts = --disable-socket --allow-unix-socket` added to `pyproject.toml`; `docker run --network none ... pytest tests/test_fx.py` prints `2 passed`.

---

## Exit Criteria

DONE when no test in scope reaches a non-local host, every former real call has a stub (plus explicit error-path tests), and the block stays on in config.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 1 | nock does not see `fetch` calls | **Adjust**: use msw, or upgrade nock to a version that documents fetch support. |
| Phase 2 | Base URL is a hard-coded constant in Go | **Adjust**: add a config field or constructor parameter; keep the constant as the default. |
| Phase 3 | Other tests break under the permanent block | **Adjust**: mark only those that truly need sockets with `enable_socket` and record them; do not remove the block. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
