# Python Feature Gate

**One-line description:** Implements Python feature gating as one function and one decorator or FastAPI dependency that combine the local account_entitlements table with the subscription access policy, and proves every status and feature combination with parametrized pytest cases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `entitlement_map` (object[], required): From `bill-entitlements-model`.
- `entitlement_table_schema` (string, required): From `bill-entitlements-model`.
- `access_policy` (object[], required): From `bill-dunning-config`.

---

## Outputs

- `gate_code` (string): Path to `app/billing/gate.py` and the list of routes or services it protects.
- `gate_tests` (string): Path to `tests/test_gate.py` and the pytest summary line.

---

## Phase 1: Write the Gate

### Entry Criteria
- `account_entitlements` and `subscription_billing_state` tables exist.

### Actions
1. One decision function, no network calls:
   ```python
   def can_use(account_id: str, feature_key: str, *, write: bool) -> Decision:
       state = load_billing_state(account_id)          # status, first_payment_failed_at
       level = access_level(state, ACCESS_POLICY, now())  # "full" | "read_only" | "none"
       if level == "none" or (level == "read_only" and write):
           return Decision(False, reason=f"billing_{state.status}")
       if feature_key not in load_entitlements(account_id):
           return Decision(False, reason="not_in_plan")
       return Decision(True, reason="ok")
   ```
2. `access_level` reads `ACCESS_POLICY` loaded from the stored policy data, including the grace rule on `first_payment_failed_at`. Do not copy policy values into code.
3. Numeric limits from `entitlement_map` (seats, projects): a separate `within_limit(account_id, limit_key, current_count)` that compares against the mapped limit; count with a database query in the same transaction as the create to avoid races (`SELECT count(*) ... FOR UPDATE` on the account row).
4. Wrappers: Flask decorator `@requires_feature("sso", write=True)` returning 402 or 403 with the `reason`; FastAPI dependency `Depends(require_feature("sso", write=True))` raising `HTTPException`. Pick one status code convention with the user and use it everywhere.
5. Cache entitlements per request only (for example in `flask.g`), never across requests, so a webhook update takes effect on the next request.
6. Edit one file at a time: write `gate.py`, run the tests, then add wrappers to routes.

### Output
`gate_code`.

### Quality Gate
- `grep -rn "stripe\." app/billing/gate.py` returns nothing: the gate never calls the billing API.
- Every route in the protection list has the wrapper (`grep -n "requires_feature\|require_feature" <route files>` count equals the list length).

---

## Phase 2: Test Every Combination

### Entry Criteria
- `gate.py` written.

### Actions
1. Parametrize over every `access_policy` row times {feature in plan, not in plan} times {read, write}:
   ```python
   @pytest.mark.parametrize("status,days_failed,in_plan,write,expected", CASES)
   def test_can_use(db, status, days_failed, in_plan, write, expected): ...
   ```
   Build `CASES` from the policy file so a new policy row creates new cases automatically.
2. Include boundary cases at `grace_period_days` exactly and one day past, with a frozen clock (`freezegun` or `time-machine`).
3. Test numeric limits at limit minus one, limit, and limit plus one.
4. Run `pytest -q tests/test_gate.py`. Do not delete or loosen a failing case; fix the gate or report the policy question.

### Output
`gate_tests`.

### Quality Gate
- `pytest -q tests/test_gate.py` exits 0 and the summary shows the case count equal to rows x 2 x 2 plus boundary and limit cases.

---

## Worked Example

Illustrative only.

Policy: `past_due` full for 7 days then read_only. Account on Pro (`sso`), `past_due`, failed 8 days ago: `can_use(acct, "sso", write=False)` gives allowed; `write=True` gives denied with reason `billing_past_due`. `pytest -q` prints `76 passed in 0.84s`.

---

## Exit Criteria

DONE when one network-free gate function enforces plan features, access policy and numeric limits, every protected route uses it, and the generated test matrix passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Gate needs data not in local tables | **Return**: add it to the webhook sync, not a live API call. |
| Phase 1 | Seat count race allows one over the limit | **Adjust**: lock the account row while counting and inserting. |
| Phase 2 | Test fails at the grace boundary | **Adjust**: compare with the policy's stated inclusive or exclusive rule; ask the user if unstated. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
