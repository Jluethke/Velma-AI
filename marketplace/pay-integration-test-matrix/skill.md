# Payments Pre-Release Test Matrix

**One-line description:** Collects the evidence from the earlier payment flows into one pass or fail matrix (happy path, declines, 3D Secure, duplicate webhooks, refunds, disputes, PCI scope, live-key guard) and issues a release verdict only when every required row has recorded evidence.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sca_test_results` (object[], required): Output of `pay-sca-3ds-handling`. Mark rows N/A when the provider is not Stripe.
- `dedup_test_results` (object[], required): Output of `pay-webhook-dedup-ordering`.
- `refund_procedure` (object, required): Output of `pay-refunds-partial` (or the refund section of the PayPal or Adyen flow).
- `pci_scope_report` (object, required): Output of `pay-pci-scope-saq`.

---

## Outputs

- `test_matrix_report` (object[]): One row per check: id, description, evidence (command plus output excerpt or object id), result `pass`, `fail` or `n/a` with reason.
- `release_verdict` (string): `READY` or `NOT READY: <list of failing or missing row ids>`.

---

## Phase 1: Build the Matrix

### Entry Criteria
- All four inputs present (N/A sections must say why).

### Actions
1. Create these rows:
   | Id | Check | Evidence source |
   |---|---|---|
   | M1 | Success card pays and webhook fulfills once | `sca_test_results` row for 4242, `dedup_test_results` |
   | M2 | Generic decline shows message, no order paid | Browser run with `4000 0000 0000 0002`, order status query |
   | M3 | Insufficient funds decline | Browser run with `4000 0000 0000 9995` |
   | M4 | 3D Secure complete and fail paths | `sca_test_results` |
   | M5 | Duplicate webhook processed once | `dedup_test_results` |
   | M6 | Out-of-order webhook keeps correct state | `dedup_test_results` |
   | M7 | Tampered webhook rejected with 400 | Stack webhook flow test output |
   | M8 | Partial refund bounded by remaining amount | `refund_procedure` |
   | M9 | Refund failure handled | `refund_procedure` |
   | M10 | No card data in own requests or logs | `pci_scope_report.network_capture_ok` and `log_redaction_ok` |
   | M11 | Live key rejected outside production | Guard test from `pay-test-mode-setup` |
   | M12 | Idempotent create under retry | Test from `pay-idempotency-keys` |
2. For each row copy the evidence: the exact command or steps and the output excerpt or ids. Evidence from memory or from "it worked earlier" is not evidence.

### Output
Matrix with evidence fields.

### Quality Gate
- Every row has an evidence field that contains a command, an object id (`pi_`, `re_`, `evt_`, or provider equivalent) or a test runner summary line.

---

## Phase 2: Rerun Gaps

### Entry Criteria
- Matrix built.

### Actions
1. For any row with missing evidence, run the check now in test mode and paste the output.
2. Rerun the full automated test suite once: `pytest -q`, `npx vitest run` / `npx jest`, or `go test ./...`, and paste the summary line.
3. Never mark a row pass by editing or skipping a test. A skipped test counts as missing.

### Output
Complete matrix.

### Quality Gate
- The suite summary shows zero failures and the skip count is stated.

---

## Phase 3: Verdict

### Entry Criteria
- Every row is `pass`, `fail` or `n/a` with reason.

### Actions
1. `release_verdict` = `READY` only if every row is `pass` or justified `n/a`. Otherwise `NOT READY:` followed by the failing or missing ids.
2. Add the open items from earlier flows (for example `integration_plan.open_questions`, PCI `eligibility_items_to_confirm`) as a separate list for the owner. These do not change the verdict but must be shown.
3. The verdict covers test mode only. Write that live-mode keys, the live webhook endpoint and its separate signing secret must be configured and smoke-tested at launch.

### Output
`test_matrix_report`, `release_verdict`.

### Quality Gate
- `release_verdict` is exactly `READY` or starts with `NOT READY:`.
- The report contains the test-mode-only note.

---

## Worked Example

Illustrative.

| Id | Result | Evidence |
|---|---|---|
| M1 | pass | `pi_3Qa...` succeeded; `evt_3Qb...` `[200]`; fulfillments count 1 |
| M7 | pass | `curl ... -w "%{http_code}"` printed `400` |
| M9 | fail | No webhook handler for `refund.updated` yet |

`release_verdict` = `NOT READY: M9`.

---

## Exit Criteria

DONE when every matrix row has evidence and a result, the full suite has been rerun, and a verdict is issued.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Input flow never ran | **Return**: run that flow first; mark rows missing meanwhile. |
| Phase 2 | Test suite red | **Stop**: verdict is NOT READY; list failing tests. |
| Phase 3 | Pressure to ship with a failing row | **Return**: the verdict stays NOT READY; the owner may accept risk in writing outside this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
