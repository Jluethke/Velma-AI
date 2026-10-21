# Pytest HTTP Boundary Mocking

**One-line description:** Replaces real outbound HTTP in slow Python tests with library-matched stubs (`responses` for `requests`, `respx` or `pytest-httpx` for `httpx`, `vcrpy` through `pytest-recording` for recorded traffic) and blocks accidental network use with `pytest-socket`, one test module per change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `network`.

---

## Outputs

- `py_boundary_mocks` (object): One row per module: HTTP client library, stub library chosen, endpoints stubbed (method, URL), source of each stubbed payload, commit SHA, seconds before and after, and the `--disable-socket` run result.

---

## Phase 1: Find Every Real Call

### Entry Criteria
- At least one `network` item is `todo`.

### Actions
1. Run the item's module with sockets blocked to list every real connection. Install `pytest-socket` as a dev dependency if missing, then:
   `pytest <module> --disable-socket --allow-unix-socket -q -p no:randomly`
   Each real call fails with `SocketBlockedError`; the traceback names the call site. Add `--allow-hosts=127.0.0.1,localhost` if the test uses a local database or service that should stay real.
2. For each call site, record: HTTP client (`requests`, `httpx`, `aiohttp`, `urllib3`, a vendor SDK such as `boto3` or `stripe`), method, URL pattern, and what the test asserts about the response.
3. Pick the stub library from this table. Match the client; a stub for one client does not intercept another.

| Client | Stub library | Activation |
|---|---|---|
| `requests` | `responses` | `@responses.activate` or the `responses.RequestsMock()` context; `responses.add(responses.GET, url, json=..., status=200)` |
| `httpx` (sync or async) | `respx` | `with respx.mock: respx.get(url).mock(return_value=httpx.Response(200, json=...))` |
| `httpx` | `pytest-httpx` | `httpx_mock` fixture: `httpx_mock.add_response(url=..., json=...)` |
| `aiohttp` | `aioresponses` | `with aioresponses() as m: m.get(url, payload=...)` |
| `boto3` | `moto` or botocore `Stubber` | `@mock_aws` (moto 5) or `Stubber(client)`; check the moto version's docs |
| Any client, many endpoints, real payloads wanted | `pytest-recording` (vcrpy) | `@pytest.mark.vcr`, record once with `--record-mode=once`, then run with `--record-mode=none` |

### Output
Call-site list and chosen stub library per module.

### Quality Gate
- The `--disable-socket` run output lists every failing call; each is in the call-site list.

---

## Phase 2: Stub One Module

### Entry Criteria
- One module selected; suite green.

### Actions
1. Time before: `pytest <module> -q --durations=0 -p no:randomly`; record total seconds.
2. Build each stubbed response from a real source in this order: a response recorded by the vcrpy cassette; an example in the provider's official API docs; an existing fixture JSON in the repo. Record the source per endpoint. Do NOT invent response fields the code does not read; do include every field the code reads.
3. Make unmatched requests fail. `responses` raises `ConnectionError` for unregistered URLs by default; `respx.mock` by default asserts all routes were called (`assert_all_called=True`) and raises for unmatched requests; `pytest-httpx` fails the test when registered responses are not requested (check the version's docs for the option names).
4. Keep the original assertions. Add one assertion that the expected request was made, for example `assert responses.calls[0].request.url == ...` or `assert route.called`.
5. Keep at least one test that exercises the real provider as a separate, explicitly marked contract test (for example `@pytest.mark.contract`) excluded from the default run with `-m "not contract"` in config, so the stub does not drift silently. If such a test already exists, record its name.

### Output
One module changed.

### Quality Gate
- `git diff --stat` shows one test module plus, at most, new fixture or cassette files.
- Each stubbed endpoint has a recorded payload source.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Module stubbed.

### Actions
1. `pytest <module> --disable-socket --allow-unix-socket -q` must pass, proving no real network remains.
2. Mutation check: change one field the code reads in one stubbed payload (for example `"status": "paid"` to `"status": "void"`); the test that depends on it must fail. Revert.
3. Full suite with the baseline command must pass.
4. Optional, recommended: add `--disable-socket` (with needed `--allow-hosts`) to `addopts` in `pytest.ini` or `[tool.pytest.ini_options]` only after every network item is done, as a separate commit.
5. Commit: `git commit -m "test: stub HTTP in <module> with <library>"`. Record the row.

### Output
Row in `py_boundary_mocks`.

### Quality Gate
- The `--disable-socket` run passes.
- The mutation run fails and the reverted run passes.
- Full suite has zero failures.

---

## Worked Example

Illustrative. Item: `tests/integrations/test_stripe.py`, 4.1 s, client `requests` through a thin wrapper.

- Phase 1: `--disable-socket` gives 3 `SocketBlockedError` at `shop/payments.py:61` (`POST https://api.stripe.com/v1/refunds`). Stub library `responses`.
- Phase 2: payload copied from the provider's API reference example for a refund object; the code reads `id` and `status`. Test adds `assert responses.calls[0].request.url.endswith("/v1/refunds")`. Existing `tests/contract/test_stripe_live.py` marked `contract` stays.
- Phase 3: module 4.1 s to 0.08 s; payload `status` mutated to `failed` makes `test_refund_marks_order` fail; full suite green.

---

## Exit Criteria

DONE when every `network` item is `done` with a stubbed module that passes under `--disable-socket`, a failing payload mutation, a green full suite, and payload sources recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test needs a real local service (database, Redis) | **Adjust**: allow it with `--allow-hosts`; only external hosts are stubbed here. |
| Phase 2 | Vendor SDK uses its own HTTP stack that the stub does not intercept | **Adjust**: stub at the SDK client boundary with `unittest.mock.create_autospec(<client class>)` so calls are checked against real signatures. |
| Phase 2 | No real payload source exists | **Stop**: record a cassette from a sandbox account first; do not invent a payload. |
| Phase 3 | Other modules fail after the change | **Return**: a `responses` or `respx` mock was started without a context manager or decorator and leaked; scope it to the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
