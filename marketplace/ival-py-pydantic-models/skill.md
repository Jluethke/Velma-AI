# Python Request Validation With Pydantic v2

**One-line description:** Puts a Pydantic v2 model with `extra="forbid"`, typed and bounded fields, and `Literal` allowlists in front of every Python HTTP entry point (FastAPI natively, Flask and Django through `model_validate`), returns a 4xx on failure, and proves each model rejects unknown keys, wrong types and out-of-bound values with tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `entry_point_inventory` (object[], required): Output of `ival-entry-point-inventory`; this flow uses rows of kind `http_route`, `queue_consumer` and `webhook`.
- `field_rules` (object[], optional): Per-field limits from the product owner (max length, allowed values, numeric range). Fields without a rule get limits derived in Phase 1 or are listed as open questions.

---

## Outputs

- `pydantic_changes` (object): `models` (file and class name per entry point), `open_questions` (fields with no derivable limit), `test_file`, and `test_run` (the pytest summary line).

---

## Phase 1: Derive Each Field's Contract

### Entry Criteria
- `python -c "import pydantic; print(pydantic.VERSION)"` prints a version starting with `2.`. If it prints `1.x`, see Error Handling.

### Actions
1. For each entry point row, list its `parameters`.
2. Derive each field's type and limits in this order. Use the first source that has a value; never make up a number:

| Source | How to read it | Example |
|---|---|---|
| `field_rules` input | as given | `note`: max 500 |
| Database column | `rg -n "Column\(|CharField\(|String\(" models*.py` or the migration; `String(120)` or `max_length=120` gives max 120 | `email` max 254 if column is `String(254)` |
| Named standard | cite it: RFC 5321 section 4.5.3.1.3 limits a forward path to 256 octets; ISO 4217 currency codes are 3 letters; ISO 3166-1 alpha-2 country codes are 2 letters | `currency`: `Literal` of the codes you accept |
| Enumerated in code | `if x not in (...)`, `Enum` classes | `status`: `Literal["open","paid","void"]` |
| None of the above | add to `open_questions` with field and entry point | `bio`: max unknown |

3. For an `open_questions` field, still set the type and `extra="forbid"`; leave only the numeric bound out and say so in the report.

### Output
A field contract table per entry point.

### Quality Gate
- Every field in every relevant inventory row has a type and either a cited limit source or an `open_questions` entry.

---

## Phase 2: Write the Models and Wire Them In

### Entry Criteria
- Field contract table exists.

### Actions
1. Create one model file per area, for example `app/schemas/orders.py`. Template:

```python
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Sku = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=64, pattern=r"^[A-Z0-9-]+$")]

class CreateOrder(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    sku: Sku
    quantity: Annotated[int, Field(ge=1, le=999)]   # bounds from field_rules row 4
    currency: Literal["USD", "EUR"]
    note: Annotated[str, StringConstraints(max_length=500)] | None = None
```

2. Rules for the model:
   - `extra="forbid"` on every request model. The default (`"ignore"`) silently drops unknown keys, which hides mass-assignment attempts such as `{"is_admin": true}`.
   - `strict=True` stops coercion such as `"1"` to `1` and `1` to `True`. For query strings and form fields, which arrive as strings, do NOT use strict on that model; use plain typed fields so Pydantic converts `"5"` to `5` and still rejects `"five"`.
   - Use `Literal[...]` or an `Enum` for every fixed set of values.
   - Pydantic v2 `pattern` uses the Rust `regex` crate by default (config key `regex_engine`, default `"rust-regex"`), which runs in linear time. Do NOT switch it to `"python-re"` unless you need lookarounds; if you do, the pattern needs the ReDoS review in `ival-redos-regex-audit`.
   - For URLs use `HttpUrl`; for emails use `EmailStr` (needs `pip install "pydantic[email]"`).
3. Wire the model in. Pick the row for the framework:

| Framework | Wiring |
|---|---|
| FastAPI | type the body parameter: `def create(order: CreateOrder)`. Query models: `Annotated[Filter, Query()]` (FastAPI 0.115 or later supports query parameter models; check `pip show fastapi`). FastAPI returns 422 automatically. |
| Flask | `try: order = CreateOrder.model_validate(request.get_json(silent=True) or {})` / `except ValidationError as e: return {"errors": e.errors(include_input=False)}, 400` |
| Django | `CreateOrder.model_validate_json(request.body)` inside `try`, return `JsonResponse(..., status=400)` on `ValidationError` |
| Queue consumer | `CreateOrder.model_validate_json(message.body)`; on failure, reject the message to the dead-letter queue, do not retry it |

4. Use `e.errors(include_input=False)` in responses and logs so the rejected value is not echoed back (see `ival-rejected-input-logging`).
5. Change one entry point at a time and run its tests before moving to the next. Do NOT rewrite all handlers in one edit.

### Output
Model files and wired handlers.

### Quality Gate
- `rg -n "extra=\"forbid\"" app/schemas` count equals the number of request models.
- `rg -n "request\.(json|get_json|form|args)\[" --type py` finds no handler that reads a field without first validating through a model.

---

## Phase 3: Prove Rejection With Tests

### Entry Criteria
- Models wired in.

### Actions
1. Write `tests/test_schemas_<area>.py` with one parametrized test per model:

```python
import pytest
from pydantic import ValidationError
from app.schemas.orders import CreateOrder

GOOD = {"sku": "AB-1", "quantity": 1, "currency": "USD"}

@pytest.mark.parametrize("patch", [
    {"is_admin": True},            # unknown key
    {"quantity": "1"},             # string where int required (strict)
    {"quantity": 0},               # below ge
    {"quantity": 1000},            # above le
    {"currency": "BTC"},           # not in Literal
    {"sku": "ab 1;--"},            # pattern
])
def test_rejects(patch):
    with pytest.raises(ValidationError):
        CreateOrder.model_validate({**GOOD, **patch})

def test_accepts_good():
    assert CreateOrder.model_validate(GOOD).quantity == 1
```

2. Add one HTTP-level test per entry point using the framework test client (FastAPI `TestClient`, Flask `app.test_client()`, Django `Client`) that posts an unknown key and asserts status 422 (FastAPI) or 400 (your handler).
3. Run `python -m pytest tests/test_schemas_*.py -q` and record the summary line.
4. Prove the check is live: temporarily change one model to `extra="ignore"`, rerun, confirm the unknown-key test fails, then restore it and rerun to green.

### Output
`pydantic_changes`.

### Quality Gate
- pytest summary shows 0 failed, and the passed count equals the number of cases written (each model has an unknown-key case, a wrong-type case, a case for each bound, and an accept case).
- The step 4 mutation run shows 1 or more failures; the restored run shows 0 failed.

---

## Worked Example

Illustrative. Flask route `POST /orders` (EP-001) reads `sku`, `quantity`, `currency`. Column `orders.sku` is `String(64)`; `field_rules` gives quantity 1 to 999.

Phase 1 contract: `sku` str max 64 (source: column), `quantity` int 1..999 (source: field_rules), `currency` Literal USD/EUR (source: enum in `billing.py:12`).

Phase 3 run:
```
$ python -m pytest tests/test_schemas_orders.py -q
.......                                                    [100%]
7 passed in 0.21s
```
Mutation with `extra="ignore"`: `1 failed, 6 passed`. Restored: `7 passed`.

---

## Exit Criteria

DONE when every relevant entry point validates through a Pydantic v2 model with `extra="forbid"`, every field has a cited limit or an open question, and the rejection tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Pydantic 1.x installed | **Stop**: upgrading is a separate change; in v1 the equivalents are `class Config: extra = "forbid"` and `constr(max_length=...)`, but do not mix versions in one PR. |
| Phase 2 | Existing clients send extra keys and break under `forbid` | **Return**: list the keys and the clients; ask the owner whether to add them to the model or to break the clients. Do not switch to `ignore` silently. |
| Phase 2 | `strict=True` breaks query string parsing | **Adjust**: remove strict from query and form models only. |
| Phase 3 | A test fails | **Adjust** the model or handler; never delete or loosen the test. |
| Phase 3 | Mutation run still passes | **Stop**: the model is not on the request path; find where the handler reads raw input. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
