# Flag Safe Default Audit

**One-line description:** Finds every evaluation of a flag key across the repository, checks that each passes the same fail-safe default for its flag type, and proves by fault injection (provider unreachable, flag missing, wrong type) that the application serves that default instead of erroring or hanging.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`; holds the key, type, and `safe_default`.
- `repo_path` (string, required): Repository root.
- `py_flag_wiring` (object, optional): Output of `ffr-py-openfeature-wire`.
- `node_flag_wiring` (object, optional): Output of `ffr-node-openfeature-wire`.
- `go_flag_wiring` (object, optional): Output of `ffr-go-openfeature-wire`.
- `java_flag_wiring` (object, optional): Output of `ffr-java-openfeature-wire`.
- `react_flag_wiring` (object, optional): Output of `ffr-react-openfeature-wire`.

---

## Outputs

- `default_audit` (object): Every call site found with file, line, and default passed; mismatches; the three fault-injection results with the observed value, reason, and error code; startup timeout behavior; and `open_questions`.

---

## Phase 1: Find Every Evaluation

### Entry Criteria
- At least one wiring output is present.

### Actions
1. Do not trust the wiring outputs alone; search the whole repository. Run both searches:
```
rg -n --fixed-strings "<flag key>" <repo_path>
rg -n "get_boolean_value|get_boolean_details|getBooleanValue|getBooleanDetails|BooleanValue\(|BooleanValueDetails\(|useBooleanFlagValue|useFlag\(" <repo_path>
```
2. For every match from the second search, open the file and follow the key argument to its definition. Record the call site if it resolves to this flag's key.
3. Look for dynamically built keys (string concatenation or formatting such as `"checkout-" + name`). A dynamic key cannot be found by search and cannot be cleaned up later. Record each as a finding to replace with a constant.
4. Record any evaluation that bypasses OpenFeature (direct `ldclient.variation`, `unleash.isEnabled`, reading the flags file manually). These skip OpenFeature hooks and defaults handling; record them as findings.

### Output
Call site list.

### Quality Gate
- Every call site listed in a wiring output appears in the search results (none missing).
- Dynamic keys and direct vendor calls are each listed, or the list says "none found" with the search commands shown.

---

## Phase 2: Check Defaults Against the Type Rule

### Entry Criteria
- Call site list complete.

### Actions
1. For each call site, read the default argument and resolve it to a value.
2. Compare it to `flag_spec.safe_default`. Use this table to explain mismatches:

| Type | Required default | Mismatch means |
|---|---|---|
| release | old behavior | a flag outage turns on unproven code |
| kill_switch | normal operation | a flag outage switches a healthy feature off |
| experiment | control | unassigned users get treatment and pollute the analysis |
| permission | deny | a flag outage grants access |

3. Check that all call sites in all languages use the same default. Two services disagreeing on the default for one key is a mismatch even if one of them is "safe".
4. Check the provider-side default too: flagd `defaultVariant`, Unleash disabled state, LaunchDarkly `offVariation`. They should equal `safe_default` until rollout starts.
5. Fix each mismatch in its own small commit: change the default to the shared constant. Do not change behavior anywhere else in the same commit.

### Output
Mismatch list with fixes.

### Quality Gate
- Every call site has default == `safe_default`, shown in a table of file, line, default.
- Provider-side default recorded and equal to `safe_default`.

---

## Phase 3: Inject Faults and Observe

### Entry Criteria
- Defaults fixed.

### Actions
1. Run the service locally (or its integration test harness) three times, once per fault. Use the details method (`get_boolean_details`, `getBooleanDetails`, `BooleanValueDetails`, `getBooleanDetails` in Java) in a small debug endpoint or test to read `value`, `reason`, and `error_code`:

| Fault | How to cause it | Expected |
|---|---|---|
| Provider unreachable | point the host variable at a closed port (for example `FLAGD_HOST=127.0.0.1` with nothing listening, or a wrong Unleash or LaunchDarkly URL) | value = safe default, reason `ERROR`, error code such as `PROVIDER_NOT_READY` or `GENERAL` |
| Flag missing | evaluate a key that is not defined in the provider | value = safe default, error code `FLAG_NOT_FOUND` |
| Wrong type | evaluate the boolean key with the string method | value = the string default you pass, error code `TYPE_MISMATCH` |

2. For the unreachable case, also measure startup: time from process start to first served request. If startup blocks with no limit, set the provider's documented initialization timeout or use the non-waiting `setProvider` with an explicit readiness rule. Record the time.
3. Confirm the request itself succeeds (HTTP 2xx or normal return) in all three faults. A flag fault must never become a user-facing error.

### Output
`default_audit`.

### Quality Gate
- Three fault rows recorded with observed `value`, `reason`, and `error_code` copied from actual output.
- Observed value equals `safe_default` in the unreachable and missing cases.
- Startup time with the provider unreachable is recorded as a measured number, and it is finite.

---

## Worked Example

Illustrative only.

Flag `checkout-new-tax-engine`, release, safe default `false`. Python and Go services.

Phase 1: `rg` finds `app/flags.py:2` (Python) and `internal/flags/flags.go:4` (Go), plus `scripts/backfill.py:31` calling `ldclient.get().variation(...)` directly; recorded as a bypass.

Phase 2: Go default `false`, Python default `False`, flagd `defaultVariant` `off`. No mismatch.

Phase 3 (Python debug test):
```
FLAGD_HOST=127.0.0.1 FLAGD_PORT=1 pytest -q tests/test_flag_faults.py -s
unreachable: value=False reason=ERROR error_code=PROVIDER_NOT_READY
missing:     value=False reason=ERROR error_code=FLAG_NOT_FOUND
wrong type:  value='x'   reason=ERROR error_code=TYPE_MISMATCH
3 passed in 5.42s
```
Startup with provider unreachable: 5.1 s (provider deadline), then serving.

---

## Exit Criteria

DONE when every call site is found and uses the shared safe default, provider-side defaults match, and three injected faults show the safe default served without a user-facing error and with finite startup time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dynamic key found | **Adjust**: replace with a constant in its own commit; rerun the search. |
| Phase 2 | Two services disagree on the default | **Adjust**: align both to `safe_default`; record the change. |
| Phase 3 | Request fails when the provider is down | **Stop**: the code rethrows or does not use the returned default; fix before rollout. |
| Phase 3 | Startup hangs | **Adjust**: set the provider init timeout; rerun until a finite time is measured. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
