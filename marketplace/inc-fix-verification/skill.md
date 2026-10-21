# Incident Fix Verification and Mitigation Unwind

**One-line description:** Proves the permanent fix works with a regression test that fails before and passes after, ships it through a canary with an explicit abort rule, then unwinds each temporary mitigation (paused GitOps, flags, traffic weights, HPA floors) one at a time while watching the same SLI queries.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `confirmed_cause` (object, required): From `inc-hypothesis-verdict`.
- `fix_change` (object, required): The fix: pull request or commit URL, the repository, and the test command for that repository (for example `pytest`, `go test ./...`, `npm test`, `mvn test`).
- `stabilization_status` (object, required): From `inc-confirm-stabilization`; the mitigation in place and its baseline numbers.
- `metric_findings` (object, required): From `inc-promql-red-triage`; SLI queries and baselines.
- `prometheus_url` (string, required): Prometheus query API base URL.

---

## Outputs

- `fix_verification` (object): {regression_test (file and name), test_fails_before_output, test_passes_after_output, canary_steps, canary_sli_values, mitigations_unwound (each with time and SLI after), final_sli, verdict ("verified" or "not_verified")}.

---

## Phase 1: Prove the Fix in Tests

### Entry Criteria
- `fix_change` exists and `confirmed_cause` has confidence "confirmed" or "probable".

### Actions
1. The fix must include a regression test that reproduces the mechanism in `confirmed_cause` (for example: a pricing client test where the server takes longer than the timeout, asserting the circuit opens and a fallback is returned).
2. Prove the test catches the bug. Check out the fix branch, then revert only the non-test code to the pre-fix version and run the single test:
   ```
   git checkout <fix-branch>
   git checkout <base-commit> -- <changed source files, not test files>
   <test command for just that test>     # must FAIL
   git checkout <fix-branch> -- <the same source files>
   <test command for just that test>     # must PASS
   ```
   Examples of single-test commands: `pytest tests/test_pricing_client.py::test_timeout_opens_circuit`, `go test ./internal/pricing -run TestTimeoutOpensCircuit`, `npx jest pricing.test.ts -t "opens circuit"`, `mvn -Dtest=PricingClientTest#timeoutOpensCircuit test`.
3. Run the full suite with the repository's test command; it must pass.
4. Do NOT delete, skip or loosen any existing test to get green. If an existing test fails, the fix is incomplete or the test documents behavior that the fix changes; resolve it explicitly in review.

### Output
Fail-before and pass-after outputs.

### Quality Gate
- The test output shows a failure on the reverted source and a pass on the fix.
- The full suite output ends with zero failures.

---

## Phase 2: Canary the Fix

### Entry Criteria
- Phase 1 passed and the fix is merged or approved to deploy.

### Actions
1. Write the abort rule before starting: abort if the canary's error ratio or latency (same queries as `metric_findings`, filtered to the canary's version label) is worse than the stable version's over the same window. The step sizes and wait times come from the team's release policy; if none, the IC chooses and records them.
2. Deploy with the tool in use:
   - Argo Rollouts: watch with `kubectl argo rollouts get rollout <name> -n <ns> --watch`; advance with `kubectl argo rollouts promote <name> -n <ns>`; stop with `kubectl argo rollouts abort <name> -n <ns>`.
   - Plain Deployment: deploy to a separate canary Deployment behind the same Service with a small replica count, or use `inc-traffic-shift` weights.
3. At each step, run the SLI queries for canary and stable and record both.
4. If GitOps was paused during mitigation: the fix (or a revert of the bad change) must be committed to the GitOps source before re-enabling sync, or sync will reapply the bad version.

### Output
Canary step table with SLI values.

### Quality Gate
- Every canary step has canary and stable values from the same query.
- No step was promoted while the abort rule was met.

---

## Phase 3: Unwind Mitigations

### Entry Criteria
- The fix runs at full rollout.

### Actions
1. Unwind one mitigation at a time, in reverse order of application, and wait one SLI window between each:

| Mitigation | Unwind command | Watch |
|---|---|---|
| GitOps paused (Argo CD) | `argocd app set <app> --sync-policy automated` after git contains the fix | `argocd app get <app>` shows Synced and Healthy |
| GitOps paused (Flux) | `flux resume kustomization <name> -n <flux-ns>` | `flux get kustomizations` Ready True |
| Flag turned off | turn it back on only if the fix covers that path; otherwise leave off and file an action item | flag evaluations and error ratio |
| Traffic shifted | `restore_command` from `traffic_shift_result` | per-slice rate and errors |
| HPA floor raised | `restore_commands` from `scale_result` | saturation |
| Quarantined pods | `kubectl delete pod <pod> -n <ns>` | none needed |
| Inspector enabled on a Node pod | rolling restart of that Deployment | readiness |

2. After each unwind, rerun the SLI queries and compare with the baseline in `metric_findings`.
3. verdict = verified only if the final SLI is within the tolerance used in `inc-confirm-stabilization` and every mitigation is unwound or explicitly kept with a reason.

### Output
`fix_verification`.

### Quality Gate
- Each unwound mitigation has a time and an SLI value after it.
- verdict is set by the rule in Action 3.

---

## Worked Example

Illustrative only. Fix PR adds a circuit breaker and fallback to the pricing client in Go.

- Phase 1: `git checkout <base> -- internal/pricing/client.go`; `go test ./internal/pricing -run TestTimeoutOpensCircuit` prints `--- FAIL: TestTimeoutOpensCircuit`. Restore the fix file: `ok checkout/internal/pricing 0.41s`. `go test ./...` all ok.
- Phase 2: Argo Rollouts steps set by IC. Canary error ratio 0.0018 versus stable 0.0021; promoted each step.
- Phase 3: Argo CD auto-sync re-enabled after the revert commit is on main; app Synced and Healthy. Error ratio 0.0020. Verdict verified.

---

## Exit Criteria

DONE when the regression test is proven to fail before and pass after, the canary passed its abort rule at every step, every mitigation is unwound or kept with a reason, and the final SLI is at baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test passes on the old code | **Return**: the test does not reproduce the mechanism; rewrite it. |
| Phase 1 | Full suite fails | **Stop**: do not deploy; fix or explain the failing test in review. |
| Phase 2 | Abort rule met | **Return**: abort the rollout and return to `inc-hypothesis-verdict`; the cause may be incomplete. |
| Phase 3 | SLI worsens after an unwind | **Adjust**: reapply that mitigation and file it as an open action item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
