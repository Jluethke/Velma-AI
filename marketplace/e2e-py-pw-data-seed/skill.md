# pytest-playwright Test Data Seeding and Cleanup

**One-line description:** Gives every Python E2E test its own data through `yield` fixtures that create records with Playwright's `APIRequestContext` (or the app's ORM) and delete them after the test, makes identities unique per pytest-xdist worker with `worker_id` and `uuid4`, and proves isolation with two consecutive parallel runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `py_fixture_layer` (object, required): From `e2e-py-pw-fixtures-pom`.
- `seed_api` (object, optional): `{kind: "http"|"orm"|"cli", create_endpoints[], delete_endpoints[], admin_token_env}`.

---

## Outputs

- `py_data_fixtures` (object): `{fixtures[{name, scope, creates, deletes}], api_context_fixture, unique_key_rule, double_run_output}`.

---

## Phase 1: Choose the Seeding Path

### Entry Criteria
- `py_fixture_layer.conftest_path` exists.

### Actions
1. First available row:

| Available | Use |
|---|---|
| HTTP API for create and delete | Session-scoped `APIRequestContext` from the `playwright` fixture |
| Django or SQLAlchemy models, app runs in the same process (`live_server`) | ORM calls inside the fixture, with `pytest-django` `django_db` access configured for live server tests (`transactional_db`) |
| App runs in a separate process with a CLI | `subprocess.run([...], check=True)` |

2. Verify each create and delete call by hand (`curl -i`, or a one-off ORM call in `python manage.py shell`) and record the result.
3. Do not seed through the UI.

### Output
Chosen path with verified calls.

### Quality Gate
- Every create and delete call has a recorded success (2xx or no exception).

---

## Phase 2: Write the Fixtures

### Entry Criteria
- Calls verified.

### Actions
1. In `e2e/conftest.py`:
```python
import os
import uuid
from typing import Iterator

import pytest
from playwright.sync_api import APIRequestContext, Playwright


@pytest.fixture(scope="session")
def api(playwright: Playwright, base_url: str) -> Iterator[APIRequestContext]:
    ctx = playwright.request.new_context(
        base_url=base_url,
        extra_http_headers={"Authorization": f"Bearer {os.environ['E2E_ADMIN_TOKEN']}"},
    )
    yield ctx
    ctx.dispose()


@pytest.fixture
def product(api: APIRequestContext, worker_id: str) -> Iterator[dict]:
    sku = f"e2e-{worker_id}-{uuid.uuid4().hex[:8]}"
    res = api.post("/api/admin/products", data={"sku": sku, "name": f"Mug {sku}", "price_cents": 1200})
    assert res.status == 201, res.text()
    item = res.json()
    yield item
    api.delete(f"/api/admin/products/{item['id']}")
```
2. `worker_id` comes from pytest-xdist (`gw0`, `gw1`, ... or `master` without `-n`). If pytest-xdist is not installed, drop it from the signature and use only `uuid4`.
3. Code after `yield` runs even when the test fails. Do not move cleanup into a `finally` in the test body.
4. Never hard-code identities such as `test@example.com`; parallel workers will collide.
5. `base_url` is the fixture provided by pytest-base-url from the `--base-url` option.

### Output
Data fixtures.

### Quality Gate
- `pytest --fixtures e2e | grep -E "^(api|product) "` lists both.
- `grep -rn "@example.com\"" e2e` prints nothing.

---

## Phase 3: Prove Isolation

### Entry Criteria
- Fixtures written.

### Actions
1. Install `pytest-xdist` if missing (same tool as setup flow) and run twice: `pytest e2e -n 4 -q && pytest e2e -n 4 -q`. Any worker count above 1 proves parallel isolation.
2. Query leftovers through the API (`?sku_prefix=e2e-`) or ORM. It must be empty.
3. If `transactional_db` is used with `live_server`, note that pytest-django flushes tables after each such test; that is the cleanup, and the leftover check must still be empty.

### Output
`py_data_fixtures` with `double_run_output`.

### Quality Gate
- Both runs end with `passed` and no `failed` or `error`.
- Leftover query returns no records from this run.

---

## Worked Example

Illustrative only.
```
$ uv add --dev pytest-xdist
$ uv run pytest e2e -n 4 -q && uv run pytest e2e -n 4 -q
....                                                   [100%]
4 passed in 6.02s
....                                                   [100%]
4 passed in 5.88s
$ curl -s 'http://localhost:8000/api/admin/products?sku_prefix=e2e-' -H "Authorization: Bearer $E2E_ADMIN_TOKEN"
[]
```
An earlier draft used `sku="e2e-mug"`; the second worker failed with `409 Conflict`. The unique key rule fixed it.

---

## Exit Criteria

DONE when every test receives uniquely named data from a `yield` fixture that cleans up, and two consecutive parallel runs pass with no leftovers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `fixture 'worker_id' not found` | **Adjust**: install pytest-xdist or remove the parameter. |
| Phase 2 | `KeyError: 'E2E_ADMIN_TOKEN'` | **Return**: ask the user to export the token; never write it into conftest. |
| Phase 3 | `Database access not allowed` with pytest-django | **Adjust**: request `transactional_db` in the fixture that uses the ORM. |
| Phase 3 | 409 or unique constraint on second run | **Adjust**: apply the unique key rule to the colliding field. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
