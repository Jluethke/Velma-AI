# Leak Regression Guard Test

**One-line description:** Writes a deterministic test that fails on the pre-fix code and passes on the fix by asserting an invariant (object freed through a weak reference, listener count unchanged, goroutines gone, container size bounded, sanitizer clean) instead of a byte threshold, and proves it by running it against both commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause` (object[], required): From `leak-root-cause-confirm`.
- `leak_fix` (string, required): From `leak-fix-minimal-change`. Branch and commit.
- `stack` (string, required): `python`, `node`, `browser`, `jvm`, `go` or `cpp`.

---

## Outputs

- `leak_regression_test` (object): Test file path and name, the invariant it asserts, the command to run it, and its result on the pre-fix commit (must fail) and on the fix commit (must pass).

---

## Phase 1: Pick the Invariant

### Entry Criteria
- `leak_fix` commit exists.

### Actions
1. Prefer a count or reachability invariant. Byte thresholds depend on allocator and runtime version and make flaky tests. Pick from:

   | Stack | Invariant and mechanism |
   |---|---|
   | python | `weakref.ref(obj)` to an object created through the real path; after `del` and `gc.collect()`, `ref() is None`. Or `len(cache)` (or `quote_for.cache_info().currsize`) stays at or below `maxsize` after more distinct calls than `maxsize`. |
   | node | run with `node --expose-gc`; `emitter.listenerCount(evt)` before equals after N operations; or a `WeakRef` to the object is cleared after `global.gc()` (GC timing for WeakRef is not guaranteed in the same turn; await a `setImmediate` before checking, and prefer listener counts when possible). |
   | browser | in Playwright or Puppeteer, `Nodes` and `JSEventListeners` from `Performance.getMetrics` after N open-close cycles, with `window.gc()`, equal the values after 1 cycle. |
   | jvm | listener list size or cache `estimatedSize()` bounded; for thread leaks, `Thread.activeCount()` or a named thread count before equals after. Avoid asserting on `WeakReference` after `System.gc()`; the JVM may ignore the request. |
   | go | `defer goleak.VerifyNone(t)` in the test, or `goleak.VerifyTestMain(m)`; for map leaks, `len(store.items)` after N sessions closed equals 0. |
   | cpp | the unit test runs under ASan or LSan in CI and must exit 0; `ASAN_OPTIONS=detect_leaks=1`. For still-referenced growth, assert container `size()` after N operations. |

2. The invariant must target the exact holder named in `root_cause`, not a general "memory went down" check.

### Output
Chosen invariant and mechanism.

### Quality Gate
- The invariant names the holder from `root_cause` and is one row of the table.

---

## Phase 2: Write the Test

### Entry Criteria
- Invariant chosen.

### Actions
1. Put the test next to existing tests for that module, using the project's framework (pytest, Jest or Vitest or `node:test`, JUnit, `go test`, GoogleTest or Catch2). Copy the structure of a neighboring test file.
2. Drive the real call path the load uses, N times, where N is larger than any bound in the fix (so a missing bound would show). N here is a test parameter, not a performance claim.
3. Python example:
   ```python
   import gc, weakref
   from orders.views import price_quote      # public path that exists before and after the fix

   def test_price_quote_does_not_retain_carts():
       refs = []
       for i in range(50):
           cart = make_cart(sku="A1", region="us")   # same key, new object each time
           price_quote(cart)
           refs.append(weakref.ref(cart))
           del cart
       gc.collect()
       assert [r for r in refs if r() is not None] == []
   ```
   Go example:
   ```go
   func TestFetchQuoteNoGoroutineLeak(t *testing.T) {
       defer goleak.VerifyNone(t)
       for i := 0; i < 50; i++ { _, _ = fetchQuote(ctxWithShortTimeout(), slowServer.URL) }
   }
   ```
4. Do not add `sleep` calls to make the test pass. If a background task needs to finish, wait on its completion signal (channel, promise, `join`).

### Output
Test file committed on the fix branch.

### Quality Gate
- The new test runs alone and passes on the fix branch: `pytest -q path::test_name`, `npx jest -t "<name>"`, `go test -run TestName ./pkg/...`, `mvn -q -Dtest=ClassName#method test`, or `ctest -R <name>`; the summary line is saved.

---

## Phase 3: Prove It Catches the Leak

### Entry Criteria
- Test passes on the fix branch.

### Actions
1. Check out only the source files of the fix from the base commit, keeping the new test: `git checkout <base_commit> -- <fixed source files>` (list only the source files the fix changed, never the test file).
2. Run the same single-test command. It must fail, and the failure message must mention the invariant (listener count, goleak "found unexpected goroutines", currsize, LeakSanitizer report).
3. Restore the fix: `git checkout HEAD -- <fixed source files>`. Run the test again; it must pass.
4. Run the full suite once more to confirm nothing else changed.
5. If the test passes on the pre-fix code, it does not guard the leak. Rewrite it; do not keep it.

### Output
`leak_regression_test`.

### Quality Gate
- Saved output shows the test failing on the pre-fix source and passing on the fix.
- `git status --porcelain` is empty after restoring (no leftover pre-fix files).

---

## Worked Example

Illustrative only.

Input: root cause C1 `quote_for` cache, fix commit `a41c9e2`, `stack` = `python`.

Phase 1: invariant: every `Cart` passed through `price_quote` is freed (weak reference cleared) after `gc.collect()`. Targets the holder: the cache must not keep `Cart` objects.

Phase 2: `tests/test_pricing.py::test_price_quote_does_not_retain_carts`; `pytest -q tests/test_pricing.py::test_price_quote_does_not_retain_carts` prints `1 passed in 0.41s`.

Phase 3: `git checkout a41c9e2~1 -- orders/pricing.py orders/views.py`; the same command prints `1 failed` with `AssertionError: assert [<weakref at 0x7f...; to 'Cart' at 0x7f...>, ...] == []`, because the old `lru_cache(maxsize=None)` keys on `Cart`. `git checkout HEAD -- orders/pricing.py orders/views.py`; passes. Full suite `413 passed`.

---

## Exit Criteria

DONE when a test asserting the holder's invariant fails on the pre-fix source, passes on the fix, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No count or reachability invariant fits | **Adjust**: assert a container size reachable through a test-only accessor; do not fall back to RSS thresholds in unit tests. |
| Phase 2 | Test is flaky across runs | **Adjust**: remove timing dependence; wait on completion signals, call the GC hook the table names. |
| Phase 3 | Test passes on pre-fix code | **Retry**: rewrite the test to drive the exact path in `root_cause`. |
| Phase 3 | Pre-fix checkout fails to compile with the new test | **Adjust**: call the leak through an API that exists in both versions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
