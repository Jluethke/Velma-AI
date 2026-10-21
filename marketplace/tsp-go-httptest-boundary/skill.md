# Go HTTP Boundary with httptest

**One-line description:** Replaces real outbound HTTP in slow Go tests with an in-process `httptest.NewServer` whose URL is injected through the client's base URL field, or with a custom `http.RoundTripper` on the `http.Client`, one test per change, with payloads from a documented source.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `network`.

---

## Outputs

- `go_boundary_mocks` (object): One row per test: client type, injection point (base URL field, `http.Client.Transport`, interface), endpoints served, payload source, commit SHA, seconds before and after, and the offline run result.

---

## Phase 1: Find the Injection Point

### Entry Criteria
- At least one `network` item is `todo`.

### Actions
1. For the item, find how the production code builds its HTTP client: `grep -rn "http.Client{\|http.DefaultClient\|http.Get(\|BaseURL\|baseURL" <package dir>`.
2. Choose the injection point with this table:

| Code shape | Injection |
|---|---|
| Client struct has a base URL field or option (`BaseURL`, `WithEndpoint`) | Point it at `srv.URL` from `httptest.NewServer` |
| Code accepts an `*http.Client` | Pass `srv.Client()` with a base URL, or `&http.Client{Transport: fakeRT}` where `fakeRT` implements `RoundTrip(*http.Request) (*http.Response, error)` |
| Code calls `http.Get` or `http.DefaultClient` with a hard-coded URL | Add an optional field (default unchanged) holding the base URL or `*http.Client`; this is the only production change allowed |
| Vendor SDK client | Use the SDK's documented endpoint or HTTP client option (for example an endpoint override in its config); check the SDK docs, do not guess option names |

3. Record what the test asserts about the response and which fields the code reads.

### Output
Injection point per item.

### Quality Gate
- Each item names one injection point and the `file:line` where it is set.

---

## Phase 2: Serve the Response

### Entry Criteria
- One item selected; `go test ./...` green.

### Actions
1. Time before: `go test -count=1 -run '^TestName$' -v ./pkg` and record `--- PASS: TestName (N.NNs)`.
2. Write the server in the test:
   `srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { ... }))`
   `t.Cleanup(srv.Close)`
   Inside the handler, check `r.Method` and `r.URL.Path` and call `t.Errorf` on anything unexpected, then write the payload with `w.Header().Set("Content-Type", "application/json")` and `w.Write(body)`.
3. Load `body` from `testdata/<name>.json` (the `testdata` directory is ignored by the Go tool for builds). The payload comes from the provider's API docs example or a response recorded from a sandbox; record the source.
4. For TLS-only clients, use `httptest.NewTLSServer` and `srv.Client()`, which trusts the test certificate.
5. Do NOT replace the client with an interface mock that returns parsed structs; that skips JSON decoding and the error paths the test covered.
6. Do NOT delete assertions or add `t.Skip`.

### Output
One test changed, payload file added.

### Quality Gate
- `go vet ./pkg` prints nothing.
- `git diff --stat` shows the test file, the `testdata` file, and at most one production file for an optional field.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Server in place.

### Actions
1. Offline proof: run the test with outbound network blocked. On Linux: `unshare -rn go test -count=1 -run '^TestName$' ./pkg` (runs in a new network namespace with only loopback; requires unprivileged user namespaces). Otherwise set `HTTPS_PROXY=http://127.0.0.1:9` and `HTTP_PROXY=http://127.0.0.1:9` for the run; Go's default transport honors these variables, so any real call fails. Note that `httptest` servers on 127.0.0.1 bypass the proxy by default.
2. Mutation check: change one field the code reads in the `testdata` payload; the test must fail. Revert.
3. `go test -count=1 -race ./pkg` and `go test -count=1 ./...` must pass.
4. Commit: `git commit -m "test: httptest server for <TestName>"`. Record the row.

### Output
Row in `go_boundary_mocks`.

### Quality Gate
- Offline run prints `ok`.
- Mutation run prints `--- FAIL`.
- Full suite prints no `FAIL` lines.

---

## Worked Example

Illustrative. Item: `fx.TestConvertEUR`, 2.9 s, code `fx.Client{BaseURL: "https://rates.example.com"}`.

- Phase 1: injection point `BaseURL` at `fx/client.go:18`.
- Phase 2: handler checks `r.URL.Path == "/v1/latest"` and writes `testdata/latest_eur.json`, copied from the provider's documented example response. `c := fx.Client{BaseURL: srv.URL}`.
- Phase 3: `--- PASS: TestConvertEUR (2.90s)` becomes `(0.00s)`. `unshare -rn` run prints `ok`. Changing `"rates"` to `"rate"` in the JSON gives `--- FAIL: TestConvertEUR`. Full suite passes.

---

## Exit Criteria

DONE when every `network` item is `done` with an in-process server, an offline pass, a failing payload mutation and a green suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No injection point and adding a field would change a public API used elsewhere | **Adjust**: use an unexported package-level variable for the base URL set from tests in the same package; record the choice. |
| Phase 3 | `unshare` not permitted | **Adjust**: use the proxy-variable method. |
| Phase 3 | Proxy method does not block because the client sets its own `Transport` without `Proxy` | **Adjust**: block with a firewall rule in a container run, or record the offline proof as not available. |
| Phase 3 | Mutation still passes | **Stop**: the code does not read that field, or the test does not assert it; pick a field the assertion depends on. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
