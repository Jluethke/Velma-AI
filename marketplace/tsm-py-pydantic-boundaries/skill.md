# Runtime Validation at Boundaries With pydantic

**One-line description:** Finds every place untrusted data enters a Python program (web request bodies, `json.loads`, HTTP client responses, environment variables, files, queue messages), validates it once there with pydantic v2 (`BaseModel.model_validate`, `model_validate_json`, `TypeAdapter`, `pydantic-settings`), and passes only validated, statically typed values inward.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_unsafe_fixes` (object, required): From `tsm-py-eliminate-any-cast`; the casts it routed here mark known boundaries.
- `boundary_list` (string[], optional): Extra entry points the user names.

---

## Outputs

- `py_boundary_validators` (object[]): One row per boundary: location, source kind, model or adapter name, validation call, failure behavior, and the two test names (one valid input, one invalid input).

---

## Phase 1: Inventory the Boundaries

### Entry Criteria
- The checker exits 0.

### Actions
1. Search and record hit counts:
   - `grep -rnE "json\.loads?\(" src`
   - `grep -rnE "\.json\(\)" src` (requests, httpx responses)
   - `grep -rnE "os\.environ|os\.getenv" src`
   - `grep -rnE "request\.(json|form|args|get_json)|await request\.json\(\)" src` (Flask, Starlette)
   - `grep -rnE "yaml\.safe_load|csv\.(DictReader|reader)|tomllib\.load" src`
   - Queue and message consumers: grep the client's receive or callback registration.
2. Add `boundary_list` entries and the boundaries noted by `py_unsafe_fixes`.
3. Framework check: FastAPI already validates request bodies and query parameters declared with pydantic models in the endpoint signature. For FastAPI endpoints, confirm the parameter is a model, not `dict` or `Request`, and skip writing a second validation.
4. Classify:

   | Source | Call | On failure |
   |---|---|---|
   | Web request body (non-FastAPI) | `Model.model_validate_json(raw_body)` or `model_validate(parsed)` | Return 400 with `e.errors(include_url=False)` field locations and messages. |
   | Outgoing HTTP response | `Model.model_validate_json(resp.content)` inside the client function | Raise a typed client error naming the service. |
   | Environment | One `pydantic_settings.BaseSettings` subclass instantiated at startup | Process exits at startup listing invalid variables. |
   | File, queue message | `TypeAdapter(T).validate_json(data)` or `model_validate_json` | Existing behavior (dead-letter, skip, log); record which. |

### Output
Classified inventory.

### Quality Gate
- Each grep was run with its count recorded; every hit is classified or marked "not a boundary" with a reason.

---

## Phase 2: Write Models and Validate Once

### Entry Criteria
- Inventory complete. If the project already uses another validator (msgspec, attrs with cattrs, marshmallow), use it with the same steps and do not add pydantic.

### Actions
1. Check the version: `python -c "import pydantic; print(pydantic.VERSION)"`. This flow uses the v2 API. Version 1 names (`parse_obj`, `parse_raw`, `Config` inner class, `@validator`) differ; on v1, **Return** to the user (upgrading is a separate dependency change).
2. Enable the mypy plugin when mypy is the checker: `plugins = ["pydantic.mypy"]` in `[tool.mypy]`. It types `__init__` signatures of models.
3. Write the model next to the boundary:
   ```python
   from pydantic import BaseModel, ConfigDict, Field

   class LineItem(BaseModel):
       model_config = ConfigDict(extra="forbid", frozen=True)
       sku: str = Field(min_length=1)
       qty: int = Field(gt=0)

   class CreateOrder(BaseModel):
       model_config = ConfigDict(extra="forbid", frozen=True)
       customer_id: UUID
       items: list[LineItem] = Field(min_length=1)
       note: str | None = Field(default=None, max_length=500)
   ```
   - Default `extra` is `"ignore"` (unknown keys dropped). Use `"forbid"` only when the contract says unknown keys are errors; record the choice.
   - Lax mode (default) converts `"2"` to `2` for `int` fields. If the contract requires exact JSON types, set `strict=True` in `model_config` and record it.
4. Reuse existing TypedDicts without a model: `TypeAdapter(WebhookEvent).validate_json(body)` validates against the TypedDict from `tsm-py-typeddict-protocol` and returns a plain dict typed as `WebhookEvent`. Create each `TypeAdapter` once at module level, not per call.
5. Validate exactly once at the boundary and pass the result inward:
   ```python
   try:
       order = CreateOrder.model_validate_json(request.get_data())
   except ValidationError as e:
       return {"errors": e.errors(include_url=False)}, 400
   create_order(order)  # parameter typed CreateOrder
   ```
   Prefer `model_validate_json` on raw bytes over `json.loads` followed by `model_validate`: one pass, and JSON-mode rules apply.
6. Environment: `pip install pydantic-settings` pinned; one `class Settings(BaseSettings)` with typed fields; instantiate once in `config.py`. Afterwards `grep -rnE "os\.environ|os\.getenv" src` should hit only that module.
7. Delete the `cast(...)` and loose `dict` annotations the model replaces; internal functions take the model type.
8. Tests per boundary: one valid payload accepted; one payload with a single wrong field type produces the failure behavior, asserting on the error location (for example `("items", 0, "qty")`).
9. One boundary per commit: checker, `test_command`, then `types(boundary): POST /orders`.

### Output
`py_boundary_validators`.

### Quality Gate
- Every inventoried boundary row names its validation call and two passing tests.
- `grep -rnE "os\.environ|os\.getenv" src` hits only the settings module.
- `grep -rn "cast(" src` shows no cast applied to a value that came from a boundary in the inventory.
- Checker exits 0 (with the pydantic plugin for mypy) and tests match the baseline.

---

## Worked Example

Illustrative only. Flask service, pydantic 2.8, mypy.

Phase 1: `request.get_json` 6 hits, `os.environ` 24 hits in 9 files, `.json()` 3 hits (pricing client), `json.loads` 2 hits (one on a constant fixture: not a boundary).

Phase 2: `POST /orders` uses `CreateOrder.model_validate_json(request.get_data())`. Invalid test:
```
payload = {"customer_id": "1f0c...", "items": [{"sku": "A", "qty": 0}]}
response.status_code == 400
response.json["errors"][0]["loc"] == ["items", 0, "qty"]
response.json["errors"][0]["type"] == "greater_than"
```
`Settings(BaseSettings)` replaces 24 `os.environ` reads; startup with `PORT=abc` exits with `Input should be a valid integer, unable to parse string as an integer`. Pricing client: `PriceList.model_validate_json(resp.content)`.

---

## Exit Criteria

DONE when every boundary validates once with pydantic v2 (or the project's existing validator), internal code receives typed values only, and each boundary has a valid and an invalid test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | pydantic v1 installed | **Return**: ask the user about the upgrade; do not mix v1 and v2 APIs. |
| Phase 2 | `extra="forbid"` rejects real traffic | **Return**: report the unknown keys seen; the user decides between `"ignore"` and updating the contract. |
| Phase 2 | Existing tests send invalid fixtures | **Adjust**: correct the fixtures to the documented contract; never relax the model to fit a bad fixture. |
| Phase 2 | Validation copies appear in inner layers | **Retry**: remove them; validate once at the boundary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
