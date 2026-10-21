# Python OpenFeature SDK Wiring

**One-line description:** Adds the OpenFeature Python SDK and the chosen provider to one Python service, registers the provider once at startup, and replaces one code decision with a typed flag evaluation that passes the safe default and a targeting key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `flagd_config` (object, optional): Output of `ffr-flagd-local-setup` when the provider is flagd.
- `unleash_config` (object, optional): Output of `ffr-unleash-setup` when the provider is Unleash.
- `launchdarkly_config` (object, optional): Output of `ffr-launchdarkly-setup` when the provider is LaunchDarkly.
- `repo_path` (string, required): Root of the Python service.

---

## Outputs

- `py_flag_wiring` (object): Packages and versions added, the file where the provider is registered, every call site (file and line) that evaluates the flag, the default passed at each, and the test run result.

---

## Phase 1: Install and Register the Provider

### Entry Criteria
- Exactly one of `flagd_config`, `unleash_config`, `launchdarkly_config` is present and matches `provider_choice.provider`.

### Actions
1. Find how the project pins dependencies: `pyproject.toml` (Poetry, uv, PDM, Hatch) or `requirements.txt`. Add packages with that tool only; do not mix `pip install` into a Poetry project.
2. Add `openfeature-sdk` and the provider package confirmed in `provider_choice` (for flagd: `openfeature-provider-flagd`). Example for uv: `uv add openfeature-sdk openfeature-provider-flagd`.
3. Find the single startup location (the module that builds the app: `create_app()` in Flask, the lifespan handler in FastAPI, `AppConfig.ready()` or settings import in Django, or `main()`). Register the provider there and nowhere else:
```python
from openfeature import api
from openfeature.contrib.provider.flagd import FlagdProvider

api.set_provider(FlagdProvider(host=os.environ.get("FLAGD_HOST", "localhost"), port=8013))
```
For LaunchDarkly and Unleash use the provider class from the confirmed package's README; do not guess the import path. Read connection values from environment variables named in the provider config output.
4. Do not create a provider per request. Providers hold connections and caches; one per process.
5. If the app forks workers (gunicorn, uWSGI), check the provider docs for fork safety. If streaming or gRPC connections are not fork safe, register the provider in a post-fork hook (gunicorn `post_fork` in `gunicorn.conf.py`) instead of at import time.

### Output
Provider registered once.

### Quality Gate
- `rg -n "set_provider\(" <repo_path>` returns exactly one line outside tests.
- `python -c "import openfeature, openfeature.contrib.provider.flagd"` (or the chosen provider's module) exits 0 in the project environment.

---

## Phase 2: Replace One Decision with a Flag Evaluation

### Entry Criteria
- Provider registered.

### Actions
1. Put the key and default in one constants module so every call site uses the same default:
```python
# app/flags.py
CHECKOUT_NEW_TAX_ENGINE = "checkout-new-tax-engine"
CHECKOUT_NEW_TAX_ENGINE_DEFAULT = False
```
2. At the decision point, build an evaluation context with a stable `targeting_key` (the user or account ID used for bucketing) and only the attributes targeting needs:
```python
from openfeature import api
from openfeature.evaluation_context import EvaluationContext
from app import flags

client = api.get_client()
ctx = EvaluationContext(targeting_key=str(user.id), attributes={"country": user.country, "plan": user.plan})
if client.get_boolean_value(flags.CHECKOUT_NEW_TAX_ENGINE, flags.CHECKOUT_NEW_TAX_ENGINE_DEFAULT, ctx):
    total = tax_engine_v2.compute(cart)
else:
    total = tax_engine_v1.compute(cart)
```
3. Use the typed method that matches `flag_spec.value_type`: `get_boolean_value`, `get_string_value`, `get_integer_value`, `get_float_value`, `get_object_value`. A mismatched type returns the default with a TYPE_MISMATCH error.
4. Evaluate the flag once per request and pass the result down. Do not evaluate the same flag in several layers of one request; a change mid-request can split behavior.
5. Change one call site in this phase. If more sites need the flag, add them one at a time, running the tests after each.
6. Do not delete the old code path. It stays until `ffr-flag-removal-pr`.

### Output
One call site using the flag.

### Quality Gate
- `rg -n "checkout-new-tax-engine" <repo_path>` shows the key only in the constants module (and tests).
- Every evaluation call passes the constant default, not a literal.

---

## Phase 3: Run the Existing Tests

### Entry Criteria
- Call site changed.

### Actions
1. Run the full test suite with the project's runner (`pytest -q` or the command in the README or CI file).
2. Tests must not reach a real flag service. If tests now try to connect, register the in-memory provider in a test fixture (written fully in `ffr-both-paths-test`); for now confirm that with no provider reachable the SDK returns the default and tests still pass.
3. Do not delete, skip, or loosen a failing test to get a green run. If a test fails, read the failure, fix the code, and rerun.

### Output
`py_flag_wiring`.

### Quality Gate
- The test command exits 0, and its last summary line (for example `152 passed in 8.31s`) is recorded.
- `git diff --stat` shows no test file deleted and no `@pytest.mark.skip` added.

---

## Worked Example

Illustrative only.

```
$ uv add openfeature-sdk openfeature-provider-flagd
Resolved 41 packages ...
$ rg -n "set_provider\(" app
app/main.py:18:    api.set_provider(FlagdProvider(host=os.environ.get("FLAGD_HOST", "localhost"), port=8013))
$ rg -n "checkout-new-tax-engine" app
app/flags.py:2:CHECKOUT_NEW_TAX_ENGINE = "checkout-new-tax-engine"
$ pytest -q
152 passed in 8.31s
```
`py_flag_wiring`: call site `app/checkout/service.py:74`, default `flags.CHECKOUT_NEW_TAX_ENGINE_DEFAULT` (False).

---

## Exit Criteria

DONE when the provider is registered once at startup, one decision uses a typed evaluation with the shared default and a stable targeting key, and the existing tests pass unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Import error for the provider module | **Adjust**: read the package README for the module path; do not guess another name. |
| Phase 1 | Hangs at startup | **Adjust**: the provider is waiting for a connection; set its documented timeout option and confirm the default is served when it times out. |
| Phase 2 | No stable user or account ID at the call site | **Return**: record an open question for `ffr-targeting-rules`; do not use a random or per-request value as the targeting key. |
| Phase 3 | Tests fail after the change | **Retry**: fix the code; never delete or skip the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
