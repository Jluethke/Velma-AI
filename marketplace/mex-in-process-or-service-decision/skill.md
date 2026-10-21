# In-Process Module or Separate Service Decision

**One-line description:** Decides with an explicit driver and blocker table whether the now-bounded candidate stays an in-process module of the monolith (the default) or becomes a separately deployed service, using measured evidence: enforced boundary status, shared tables, cross-boundary transactions, calls per request and the latency budget.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `extraction_brief` (object, required): Supplies `goal_test`.
- `module_interface` (object, required): From `mex-interface-boundary-contract`.
- `change_coupling` (object, required): From `mex-change-coupling-git-log`.
- `shared_tables` (object[], required): From `mex-table-ownership-map`.
- `py_boundary_rules` (object, optional): From `mex-py-boundary-import-linter`.
- `node_boundary_rules` (object, optional): From `mex-node-boundary-dependency-cruiser`.
- `go_boundary_rules` (object, optional): From `mex-go-boundary-internal-depguard`.
- `java_boundary_rules` (object, optional): From `mex-java-boundary-archunit`.

Exactly one boundary rules input is present, matching the stack.

---

## Outputs

- `deployment_decision` (string): `in_process` or `service`.
- `decision_evidence` (object): Each driver and blocker row with its yes or no answer and the evidence (command output, file, measurement), the calls-per-request measurement, the latency arithmetic, and the conditions that would change the decision.

---

## Phase 1: Gather Evidence

### Entry Criteria
- The stack's boundary rules pass in CI.

### Actions
1. Boundary status: read the boundary rules input. Record the number of remaining ignored or frozen violations.
2. Cross-boundary transactions: search for transactions that wrap calls on both sides. python `rg -n "transaction\.atomic|session\.begin|with .*\.begin\(\)" -A 15` and check whether the block calls the billing interface and writes another domain's tables; node `rg -n "\.transaction\(|queryRunner\.startTransaction" -A 15`; go `rg -n "BeginTx\(|\.Begin\(\)" -A 20`; java `rg -n "@Transactional" -A 15`. Record each one.
3. Calls per request: for the busiest entry points, count interface calls per request. Preferred: add a temporary counter or use existing tracing spans (OpenTelemetry span count per trace for the billing interface). Fallback: read the code path and count calls including loops (a call inside a loop over N items counts N).
4. Network round trip cost: measure, do not assume. From a host where the service would run, against a host in the same network, run `ping -c 20 <host>` and record the average, or measure an existing internal HTTP call's server-to-server latency from tracing. Record the number and its source.
5. Ask the user for the latency budget of the busiest entry point (an SLO or the current measured p99 plus allowed regression). If none exists, record it as an open question.

### Output
Evidence list.

### Quality Gate
- Every evidence item has a source: a command with its output, a file and line, or a user statement.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Evidence gathered.

### Actions
1. Blockers. If any is `yes`, the decision is `in_process` now, and the blocker is listed as the work needed before reconsidering:

   | # | Blocker | How to answer |
   |---|---|---|
   | B1 | Boundary rules have unfixed violations | Ignored or frozen count from Phase 1 step 1 is greater than zero |
   | B2 | `shared_tables` has any `written_by_both` row | Read `shared_tables` |
   | B3 | A business transaction must commit atomically across both sides | Phase 1 step 2 found one and the user confirms partial completion is unacceptable |
   | B4 | Added network time exceeds the latency budget | calls per request times measured round trip, plus serialization, is greater than the budget headroom; if the budget is unknown this is an open question, which also blocks |
   | B5 | No team or person will own on-call for a new deployable | Ask the user |

2. Drivers. With zero blockers, the decision is `service` only if at least one driver is `yes` and it is the one that makes `goal_test` pass:

   | # | Driver | Evidence that it is real |
   |---|---|---|
   | D1 | Must deploy on a different cadence than the monolith | `goal_test` names release independence, or deploy logs show billing changes waiting on monolith releases |
   | D2 | Needs different scaling or resource profile | Production metrics show the candidate's work dominates CPU, memory or queue depth while the rest does not |
   | D3 | Needs fault isolation (a crash or memory leak in one must not take down the other) | Incident history shows cross-impact |
   | D4 | Needs a different runtime, language or security zone (for example PCI scope reduction) | Compliance or platform requirement document |
   | D5 | Separate team ownership with conflicting change velocity | `change_coupling` and CODEOWNERS show distinct authors and the user confirms |

3. If no driver is `yes`, the decision is `in_process`. A modular monolith with enforced boundaries already gives independent code ownership; a service only adds network failure modes.
4. Record the decision and, for `in_process`, list which driver evidence would reopen it.

### Output
`deployment_decision`, `decision_evidence`.

### Quality Gate
- Each of B1 to B5 and D1 to D5 has `yes`, `no` or `open_question` with evidence.
- The decision follows mechanically from the tables (a reviewer can recompute it).

---

## Worked Example

Illustrative.

Evidence: import-linter `ignore_imports` has 0 entries (B1 no). `refunds` was `written_by_both` but writes were moved behind `billing.api.issue_refund` (B2 no). Checkout wraps `create_invoice` and `Order.mark_paid` in one `transaction.atomic()` (B3: user accepts an outbox-driven state update, so no). Checkout calls billing 2 times per request; measured server-to-server round trip 0.6 ms from tracing; budget headroom 40 ms (user SLO p99 300 ms, current 260 ms): 2 x 0.6 = 1.2 ms plus serialization, B4 no. Owner: payments team (B5 no).

Drivers: D1 yes (`goal_test`: release independence; 11 billing changes waited for the release train last quarter). D4 yes (PCI scope).

`deployment_decision = service`.

---

## Exit Criteria

DONE when every row is answered with evidence and the decision follows from the tables, with the reopening conditions recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No tracing and no way to count calls | **Adjust**: count from code paths and mark the number as a static estimate in the evidence. |
| Phase 1 | Latency budget unknown | **Return**: ask the user; B4 stays `open_question` and blocks `service`. |
| Phase 2 | User wants `service` with a blocker present | **Stop**: record the blocker and its consequence; proceed only after the user explicitly accepts it in writing in the evidence. |
| Phase 2 | Decision is `in_process` | **Return**: skip the service-only flows; continue with the anti-corruption layer, data ownership and flag cutover inside the monolith. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
