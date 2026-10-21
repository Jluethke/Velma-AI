# Flag Both-Paths Tests with the In-Memory Provider

**One-line description:** Writes tests that run the flagged code once with each variant and once with no provider (safe default) using the OpenFeature in-memory provider for the project's language, so both the old and new paths stay tested until the flag is removed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `default_audit` (object, required): Output of `ffr-safe-default-audit`; lists the call sites.
- `repo_path` (string, required): Repository root.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `react`.

---

## Outputs

- `flag_test_report` (object): Test files added, one test per variant plus one default test per call site, the in-memory provider setup used, the test command, its summary line, and a mutation check result.

---

## Phase 1: Build the In-Memory Provider Fixture

### Entry Criteria
- `default_audit` lists at least one call site in `stack`.

### Actions
1. Use the in-memory provider shipped with the OpenFeature SDK for `stack`. Do not write your own fake provider and do not mock the SDK functions.

| Stack | Import | Flag definition shape |
|---|---|---|
| python | `from openfeature.provider.in_memory_provider import InMemoryProvider, InMemoryFlag` | `InMemoryProvider({"key": InMemoryFlag("on", {"on": True, "off": False})})` |
| node, react | `InMemoryProvider` from `@openfeature/server-sdk` or `@openfeature/web-sdk` | `new InMemoryProvider({ key: { variants: { on: true, off: false }, defaultVariant: 'on', disabled: false } })` |
| go | `github.com/open-feature/go-sdk/openfeature/memprovider` | `memprovider.NewInMemoryProvider(map[string]memprovider.InMemoryFlag{...})` |
| java | `dev.openfeature.sdk.providers.memory.InMemoryProvider` and `Flag` | `Flag.builder().variant("on", true).variant("off", false).defaultVariant("on").build()` |

2. Confirm the import works before writing tests (for Python: `python -c "from openfeature.provider.in_memory_provider import InMemoryProvider"`; for Go: `go doc github.com/open-feature/go-sdk/openfeature/memprovider`). If the import path differs in the installed version, read the SDK's README and use what it shows.
3. Write a fixture that sets the provider before the code under test runs and resets it afterward. OpenFeature state is global; a test that sets `on` and does not reset will leak into the next test. Python: a pytest fixture that calls `api.set_provider(...)` and, after `yield`, `api.clear_providers()` (check the method name in your SDK version). Go: for parallel tests use the SDK's `openfeature/testing` package `TestProvider`, which scopes flags per test; otherwise do not use `t.Parallel()` in flag tests.

### Output
A reusable fixture.

### Quality Gate
- The import check command exits 0.
- The fixture resets provider state after each test (show the teardown line).

---

## Phase 2: Write the Tests

### Entry Criteria
- Fixture works.

### Actions
1. For each call site in `default_audit`, write exactly these tests:
   - `test_<site>_flag_on`: provider serves the `on` (or treatment) variant; assert the new behavior's observable output.
   - `test_<site>_flag_off`: provider serves `off` (or control); assert the old behavior's output.
   - `test_<site>_flag_missing_uses_default`: provider has no definition for the key; assert the safe default behavior.
2. For experiment flags with more than two variants, add one test per variant.
3. Assert on observable output (return value, HTTP response body, rendered text, a call to a collaborator), not on which internal function was called, unless the call itself is the behavior.
4. Do not change existing tests. If an existing test now depends on the flag, give it the fixture with the variant that matches what it already expects; do not change its assertions.
5. Add one file at a time and run it.

### Output
New tests.

### Quality Gate
- For each call site, the three tests exist (list them by name).
- The new test file runs alone and passes: `pytest -q tests/test_tax_flag.py`, `npx vitest run src/flags.test.ts` (or the Jest equivalent), `go test ./internal/checkout -run TaxFlag -v`, or `./gradlew test --tests '*TaxFlag*'`.

---

## Phase 3: Prove the Tests Can Fail

### Entry Criteria
- New tests pass.

### Actions
1. Mutation check: temporarily swap the two branches at one call site (make `on` run the old path). Run the new tests. The `on` and `off` tests must fail.
2. Revert the swap with `git checkout -- <file>` (or `git restore <file>`). Run the tests again; they must pass.
3. Temporarily change the default at the call site to the unsafe value. The `missing_uses_default` test must fail. Revert.
4. Run the full suite once.

### Output
`flag_test_report`.

### Quality Gate
- Both mutation runs show failing tests (paste the failure summary line), and both reverts show passing.
- `git diff` after reverting shows only the new test files and fixture.
- The full suite exits 0.

---

## Worked Example

Illustrative only. Stack `python`.

```python
@pytest.fixture
def flags():
    def _set(variant):
        flags_def = {} if variant is None else {
            "checkout-new-tax-engine": InMemoryFlag(variant, {"on": True, "off": False})}
        api.set_provider(InMemoryProvider(flags_def))
    yield _set
    api.clear_providers()
```
```
$ pytest -q tests/test_tax_flag.py
3 passed in 0.21s
# swap branches in app/checkout/service.py
$ pytest -q tests/test_tax_flag.py
FAILED tests/test_tax_flag.py::test_total_flag_on - assert Decimal('8.25') == Decimal('8.31')
FAILED tests/test_tax_flag.py::test_total_flag_off - assert Decimal('8.31') == Decimal('8.25')
2 failed, 1 passed in 0.24s
$ git restore app/checkout/service.py && pytest -q
155 passed in 8.40s
```

---

## Exit Criteria

DONE when each call site has on, off, and missing-default tests using the SDK in-memory provider with state reset between tests, both mutation checks made the tests fail, and the full suite passes after reverting.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | In-memory provider import fails | **Adjust**: read the installed SDK README for its path; upgrade the SDK only in a separate commit if it lacks one. |
| Phase 2 | Tests pass alone but fail in the full run | **Adjust**: provider state leaks; fix the teardown. |
| Phase 3 | Mutation does not fail any test | **Stop**: the tests do not observe the behavior; rewrite their assertions. |
| Phase 3 | Revert leaves extra changes | **Retry**: `git diff` and restore every non-test file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
