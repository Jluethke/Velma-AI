# Node.js Feature Gate

**One-line description:** Implements Node.js feature gating as one pure decision function plus Express middleware or a Next.js server helper that combine the local account_entitlements table with the subscription access policy, and proves every status and feature combination with table-driven tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `entitlement_map` (object[], required): From `bill-entitlements-model`.
- `entitlement_table_schema` (string, required): From `bill-entitlements-model`.
- `access_policy` (object[], required): From `bill-dunning-config`.

---

## Outputs

- `gate_code` (string): Path to `src/billing/gate.ts` and the list of routes or server actions it protects.
- `gate_tests` (string): Path to `src/billing/gate.test.ts` and the runner summary line.

---

## Phase 1: Write the Gate

### Entry Criteria
- `account_entitlements` and `subscription_billing_state` tables exist.

### Actions
1. Split data loading from deciding so the decision is a pure function:
   ```ts
   export function decide(state: BillingState, entitlements: Set<string>, policy: AccessPolicy,
                          feature: string, write: boolean, now: Date): Decision {
     const level = accessLevel(state, policy, now); // 'full' | 'read_only' | 'none'
     if (level === 'none' || (level === 'read_only' && write)) return { allowed: false, reason: `billing_${state.status}` };
     if (!entitlements.has(feature)) return { allowed: false, reason: 'not_in_plan' };
     return { allowed: true, reason: 'ok' };
   }
   ```
2. `canUse(accountId, feature, { write })` loads state and entitlements from the database and calls `decide`. No Stripe SDK import in this file.
3. Express: `requireFeature('sso', { write: true })` middleware calls `canUse` and responds with the agreed status code and `reason`. Next.js App Router: call `canUse` at the top of the route handler or server action and return early; middleware on the edge runtime may not reach your database driver, so do not gate there unless your driver supports it.
4. Numeric limits: `withinLimit(accountId, limitKey, tx)` counts inside the same transaction as the insert with a row lock on the account (`SELECT ... FOR UPDATE`).
5. Keep entitlements cached for one request at most (for example on `res.locals`).

### Output
`gate_code`.

### Quality Gate
- `grep -n "from 'stripe'\|require('stripe')" src/billing/gate.ts` returns nothing.
- `grep -rn "requireFeature\|canUse(" src/routes src/app` count equals the protection list length.

---

## Phase 2: Table-Driven Tests

### Entry Criteria
- `gate.ts` compiles: `npx tsc --noEmit` exits 0.

### Actions
1. Generate cases from the policy file: every row x {in plan, not in plan} x {read, write}, using `it.each(cases)` (vitest or jest).
2. Add grace boundary cases (exactly `grace_period_days` and one day past) by passing `now` to `decide`; no fake timers needed because `decide` is pure.
3. Add numeric limit cases at limit minus one, limit, limit plus one, against a test database.
4. Run `npx vitest run src/billing/gate.test.ts` (or `npx jest src/billing/gate.test.ts`). Never skip (`it.skip`) or delete a failing case to get green.

### Output
`gate_tests`.

### Quality Gate
- The runner exits 0 and the reported test count equals rows x 2 x 2 plus boundary and limit cases.
- `grep -n "\.skip\|\.only" src/billing/gate.test.ts` returns nothing.

---

## Worked Example

Illustrative only.

Policy `unpaid` gives read_only. `decide({status:'unpaid'}, new Set(['audit_log']), policy, 'audit_log', true, now)` returns `{allowed:false, reason:'billing_unpaid'}`; with `write:false` it returns allowed. `npx vitest run` prints `Tests  76 passed (76)`.

---

## Exit Criteria

DONE when a pure decision function backs every protected route, has no billing API dependency, and the generated test matrix passes with no skipped cases.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Database driver unavailable in edge middleware | **Adjust**: gate in the Node runtime route handler instead. |
| Phase 1 | Limit exceeded under concurrency | **Adjust**: count and insert in one transaction with a row lock. |
| Phase 2 | Boundary case fails | **Return**: ask the user whether the grace day is inclusive; record the answer in the policy. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
