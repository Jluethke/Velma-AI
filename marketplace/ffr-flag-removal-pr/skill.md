# Flag Removal Pull Request

**One-line description:** Removes one stale flag from code in a single focused pull request: replaces every evaluation with the kept variant, deletes the dead branch and only the tests that exercise it, removes the key constant and test fixtures, and proves with a search and the full test suite that nothing references the flag, before the flag is archived in the provider.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stale_flags` (object[], required): Output of `ffr-stale-flag-detect`; pick one row classified remove-now with a `keep_variant`.
- `repo_path` (string, required): Repository root.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `react`.
- `experiment_decision` (object, optional): Output of `ffr-experiment-readout`, when the flag was an experiment; its kept variant overrides `stale_flags`.

---

## Outputs

- `removal_pr` (object): Branch name, the list of files changed, the call sites replaced, tests deleted with justification, the search result showing zero references, test command summary, and the pull request link or local branch.

---

## Phase 1: Prepare One Flag

### Entry Criteria
- One flag chosen; its `keep_variant` is known.

### Actions
1. One flag per pull request. Do not batch flags; a batched removal that breaks something cannot be reverted for one flag only.
2. Confirm `keep_variant` is what production serves now: evaluate the flag for a sample production context (provider UI, API, or the evaluation details log). If production serves something else, stop.
3. Create a branch: `git switch -c remove-flag-checkout-new-tax-engine`.
4. List all sites: `rg -n --fixed-strings "checkout-new-tax-engine" .` and `rg -n "CHECKOUT_NEW_TAX_ENGINE|CheckoutNewTaxEngine" .` (use the constant names from the wiring flows).
5. Optional automation: Uber's Piranha (`polyglot-piranha` on PyPI) rewrites flag checks to constants for several languages using rule files. If you use it, still review every change by hand and run Phase 3 unchanged. Do not hand-write Piranha rules from memory; follow its README examples.

### Output
Branch and site list.

### Quality Gate
- The production evaluation showing `keep_variant` is pasted.
- The site list contains every hit from both searches.

---

## Phase 2: Edit Each Site

### Entry Criteria
- Site list ready.

### Actions
1. Edit one file at a time. For each evaluation site:
   - Replace the condition with the kept branch's body. Example (Python, keeping `on`): `if client.get_boolean_value(...): total = v2(...) else: total = v1(...)` becomes `total = v2(...)`.
   - Remove now-unused variables, imports, and the evaluation context built only for this flag.
   - Remove the dead branch's code only if nothing else calls it. Check with `rg -n "tax_engine_v1" .` before deleting a module; if other callers exist, leave it.
2. Tests:
   - Delete tests that only exercise the removed branch (for example `test_total_flag_off`), and list each one with the reason "tests removed branch".
   - Keep tests of the kept behavior. Remove their flag fixture setup, since the flag no longer exists; the assertions must stay unchanged.
   - Delete `test_*_flag_missing_uses_default` tests for this flag; there is no flag to be missing.
   - Never delete or weaken a test that fails for any other reason.
3. Remove the key constant and the default constant from the constants module.
4. Remove the flag from flagd files if the provider is flagd (the archive step for flagd is this file edit). For Unleash and LaunchDarkly, do not archive yet.
5. After each file, run that file's tests (`pytest -q tests/test_checkout.py`, `npx vitest run <file>`, `go test ./internal/checkout`, `./gradlew test --tests '*Checkout*'`).

### Output
Edited files.

### Quality Gate
- Every deleted test is listed with "tests removed branch" or "tests missing-flag default"; no other test deletions.
- `git diff` shows no assertion changes in kept tests (only fixture removal).

---

## Phase 3: Prove the Flag Is Gone

### Entry Criteria
- All sites edited.

### Actions
1. Run both searches again. They must return zero hits outside changelogs and docs history:
```
rg -n --fixed-strings "checkout-new-tax-engine" .
rg -n "CHECKOUT_NEW_TAX_ENGINE|CheckoutNewTaxEngine" .
```
2. Run the linter and type checker for `stack` (unused imports and variables show up here): `ruff check .` or `flake8`, `npx tsc --noEmit` and `npx eslint .`, `go vet ./...`, `./gradlew check`.
3. Run the full test suite.
4. Open the pull request. In the description: the flag key, the kept variant and its evidence, the deleted tests with reasons, and the follow-up: "archive the flag in the provider after this is deployed to every environment" (`ffr-flag-archive-in-service`).
5. Do not archive or delete the flag in Unleash or LaunchDarkly before this change is deployed everywhere. If you archive first, running code gets the code default, which may be the variant you just removed.

### Output
`removal_pr`.

### Quality Gate
- Both searches return zero lines (exit code 1 with no output, pasted).
- Lint, type check, and full tests exit 0, with summary lines recorded.

---

## Worked Example

Illustrative only. Stack `python`, keep `on`.

```
$ rg -n "CHECKOUT_NEW_TAX_ENGINE" .
app/flags.py:2:CHECKOUT_NEW_TAX_ENGINE = "checkout-new-tax-engine"
app/flags.py:3:CHECKOUT_NEW_TAX_ENGINE_DEFAULT = False
app/checkout/service.py:74:    if client.get_boolean_value(flags.CHECKOUT_NEW_TAX_ENGINE, flags.CHECKOUT_NEW_TAX_ENGINE_DEFAULT, ctx):
tests/test_tax_flag.py:12:            "checkout-new-tax-engine": InMemoryFlag(...)
$ rg -n "tax_engine_v1" .
app/checkout/service.py:77:        total = tax_engine_v1.compute(cart)
app/reports/legacy_export.py:19:from app.tax import tax_engine_v1
```
`tax_engine_v1` still used by `legacy_export.py`, so the module stays. Deleted `test_total_flag_off` and `test_total_flag_missing_uses_default`; kept `test_total_flag_on`, renamed `test_total_uses_v2`, assertions unchanged.
```
$ rg -n --fixed-strings "checkout-new-tax-engine" . ; echo "exit $?"
exit 1
$ ruff check . && pytest -q
All checks passed!
153 passed in 8.12s
```

---

## Exit Criteria

DONE when one flag is removed from code keeping the verified production variant, only branch-specific tests were deleted with reasons, both searches return zero hits, lint and tests pass, and the pull request states that provider archiving waits for full deployment.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Production serves a different variant than `keep_variant` | **Stop**: return to `ffr-stale-flag-detect`; do not guess. |
| Phase 2 | Dead branch code still has other callers | **Adjust**: keep it; remove only the flag check. |
| Phase 3 | A kept test fails | **Retry**: the wrong branch was kept or a fixture removal changed setup; fix the code, never the assertion. |
| Phase 3 | Search still finds hits | **Adjust**: edit the remaining sites; rerun all checks. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
