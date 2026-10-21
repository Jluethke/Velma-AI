# SDK Contract Tests With Prism

**One-line description:** Runs the SDK against a Stoplight Prism mock server generated from the spec, so every request the SDK sends is validated against the contract and every response it parses comes from the spec's own examples, reads Prism's violation output, and optionally runs `prism proxy` against a sandbox to catch spec drift.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): Path to the validated spec.
- `stack` (string, required): `python`, `typescript` or `go`; selects the test command.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `contract_test_report` (object): Prism version, mode, operations exercised, request violations found, response parse failures, proxy drift findings (if run), and the test runner result.

---

## Phase 1: Start Prism

### Entry Criteria
- `validated_spec` has examples or schemas for each success response (readiness rules checked schemas).

### Actions
1. Install pinned: `npm install --save-dev @stoplight/prism-cli`; record `npx prism --version`.
2. Start the mock in the background with request validation errors turned into responses:
   `npx prism mock api/openapi.yaml --port 4010 --errors > prism.log 2>&1 &`
   Port 4010 is Prism's default; `--host` defaults to 127.0.0.1. Check `npx prism mock --help` for the flags in your version.
3. Wait until it answers: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4010/<a GET path>` returns a status, or poll in a loop with a timeout. Do NOT use a fixed sleep and hope.
4. Response selection: Prism returns the first example of the lowest 2xx response by default. Force others per request with the `Prefer` header: `Prefer: code=404`, `Prefer: example=<name>`, or `Prefer: dynamic=true` to generate data from the schema. Start Prism with `--dynamic` (`-d`) to make generated data the default.

### Output
Running mock server.

### Quality Gate
- `prism.log` contains a line listing the mocked routes and no startup error.
- The curl probe returns an HTTP status.

---

## Phase 2: Run the SDK Against Prism

### Entry Criteria
- Prism running.

### Actions
1. Write `contract` tests (separate from unit mock tests) that construct the SDK with base URL `http://127.0.0.1:4010` and call one representative operation per resource with valid inputs, including one request with a body.
2. For each call, assert: no exception, the returned typed model is populated, and fields with `format: date-time` parsed.
3. Run per stack, with a marker or tag so they do not run in the unit suite:
   - python: `pytest -m contract -q`
   - typescript: `npx vitest run test/contract`
   - go: `go test ./... -tags contract -count=1`
4. Read violations: with `--errors`, an invalid request returns 422 (or 401 for missing security) with a problem body listing the failed validations; without it, Prism still serves a response and adds an `sl-violations` response header. Also scan `prism.log` for `[VALIDATOR]` and `Request did not pass the validation rules` lines (`grep -nE "VALIDATOR|violat" prism.log`).
5. Every violation is an SDK defect (wrong param name, wrong content type, missing required field) or a spec defect. Classify each.

### Output
Contract run results.

### Quality Gate
- The contract test command exits 0.
- `grep -cE "VALIDATOR.*(error|✖)" prism.log` prints 0, or every hit is classified.

---

## Phase 3: Optional Drift Check With prism proxy

### Entry Criteria
- A sandbox or staging API URL is provided and the user allows calls to it.

### Actions
1. Start a validating proxy: `npx prism proxy api/openapi.yaml https://sandbox.api.example.com --port 4011 --errors > prism-proxy.log 2>&1 &`.
2. Rerun the contract tests with base URL `http://127.0.0.1:4011` and sandbox credentials.
3. Prism forwards each request and validates the real response against the spec; violations appear in `prism-proxy.log` and the `sl-violations` header. A real response that violates the spec is spec drift: the SDK built from the spec will mis-parse it.
4. Do NOT run proxy mode against production or with production credentials.
5. Stop both Prism processes (`kill %1 %2` or by PID) and delete the logs after recording findings.

### Output
`contract_test_report`.

### Quality Gate
- If Phase 3 ran, every drift violation is listed with operation and field.
- No Prism process remains (`pgrep -f "prism (mock|proxy)"` prints nothing).

---

## Worked Example

Illustrative only. `stack = python`.

```
$ npx prism mock api/openapi.yaml --port 4010 --errors > prism.log 2>&1 &
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4010/v1/users
401
$ pytest -m contract -q
F.....
E   acme_client.UnprocessableEntityError: 422 Invalid request (request_id=None)
$ grep -n VALIDATOR prism.log
37:[CLI] ... [VALIDATOR] ✖  error   Request body must have required property 'email'
```
The 401 probe shows security is enforced (no key sent). The failure shows `users.create` sent `emailAddress` instead of `email`: an SDK mapping defect returned to the endpoint map. After the fix: `6 passed`.

---

## Exit Criteria

DONE when the SDK's representative calls pass against the Prism mock with zero unclassified validation violations, and drift findings from the optional proxy run are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Port 4010 in use | **Adjust**: pass `--port` with a free port and use it in the base URL. |
| Phase 1 | Prism fails to load the spec | **Return**: send the error to `sdk-spec-spectral-lint`. |
| Phase 2 | Response parse fails on example data | **Adjust**: if the spec example is wrong, record a spec defect; if the SDK type is wrong, fix the mapping. |
| Phase 3 | No sandbox available | **Return**: skip Phase 3 and record "drift not checked". |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
