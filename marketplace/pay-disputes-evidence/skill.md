# Disputes and Evidence Submission

**One-line description:** Captures Stripe dispute webhooks into a tracked case with its `evidence_details.due_by` deadline, assembles reason-specific evidence fields and uploaded files, stages them with `submit=false`, and submits once after review, tested with the dispute test card.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `event_store_schema` (object, required): Output of `pay-webhook-dedup-ordering`.
- `test_env` (object, required): Output of `pay-test-mode-setup`.

---

## Outputs

- `dispute_runbook` (object): Dispute table schema, webhook handlers, the reason-to-evidence table, staging and submission commands, and a test record.

---

## Phase 1: Track Every Dispute

### Entry Criteria
- Webhooks verified and deduplicated.

### Actions
1. Subscribe to `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, and `charge.dispute.funds_withdrawn` / `charge.dispute.funds_reinstated`.
2. Create a `disputes` row on `charge.dispute.created`: `dispute_id` (`dp_...`), `charge_id`, `order_id` (from the PaymentIntent metadata), `amount`, `currency`, `reason`, `status`, `due_by` (from `evidence_details.due_by`, a Unix timestamp; store as UTC).
3. Alert a named person immediately with the `due_by` date. Evidence received after `due_by` cannot be submitted.
4. Status values you will see include `warning_needs_response`, `needs_response`, `under_review`, `won`, `lost` and warning-closed states for inquiries; read the Dispute object reference for the full list on your API version.

### Output
Dispute tracking.

### Quality Gate
- After the Phase 3 test, `SELECT dispute_id, due_by FROM disputes` returns the test dispute with a non-null `due_by`.

---

## Phase 2: Assemble Evidence by Reason

### Entry Criteria
- A dispute row exists.

### Actions
1. Pull order facts: buyer name and email, IP at purchase, billing and shipping address, product description, delivery proof, customer messages, refund and cancellation policy text and where it was shown at checkout.
2. Map reason to evidence fields (names are Stripe `evidence` keys):
   | `reason` | Primary fields |
   |---|---|
   | `fraudulent` | `customer_name`, `customer_email_address`, `customer_purchase_ip`, `billing_address`, `access_activity_log` (digital goods), `shipping_documentation`, `shipping_tracking_number` |
   | `product_not_received` | `shipping_carrier`, `shipping_tracking_number`, `shipping_date`, `shipping_documentation`, or `service_date` and `service_documentation` for services |
   | `product_unacceptable` | `product_description`, `customer_communication`, `refund_policy`, `refund_policy_disclosure` |
   | `subscription_canceled` | `cancellation_policy`, `cancellation_policy_disclosure`, `cancellation_rebuttal`, `customer_communication` |
   | `credit_not_processed` | `refund_policy`, `refund_refusal_explanation`, `refund_policy_disclosure` |
   | `duplicate` | `duplicate_charge_id`, `duplicate_charge_explanation`, `duplicate_charge_documentation` |
   | other | `product_description`, `receipt`, `customer_communication`, `uncategorized_text` |
3. Upload documents as Files with purpose `dispute_evidence`: Python `stripe.File.create(purpose="dispute_evidence", file=open("receipt.pdf","rb"))`; use the returned `file_...` id in fields like `receipt` or `shipping_documentation`. Check the File upload docs for allowed types and size limits.
4. Write `uncategorized_text` and other text fields as plain facts with dates. Do not include full card numbers or unrelated customer data.

### Output
Evidence object.

### Quality Gate
- Every primary field for the dispute's `reason` is filled or has a written "not available" reason.
- Each file id resolves: `stripe files retrieve file_...` returns `purpose: dispute_evidence`.

---

## Phase 3: Stage, Review, Submit, Test

### Entry Criteria
- Evidence object assembled; `due_by` in the future.

### Actions
1. Stage without submitting: `stripe.Dispute.modify(dp_id, evidence={...}, submit=False)`. The `submit` parameter defaults to true; staging requires passing false explicitly. Evidence is submitted once; you cannot add more after submission.
2. A human reviews the staged evidence in the Dashboard.
3. Submit: `stripe.Dispute.modify(dp_id, submit=True)`. Status moves to `under_review`.
4. Test mode: pay with `4000 0000 0000 0259` (creates a fraudulent dispute). Stage evidence with `uncategorized_text` set to `winning_evidence` to simulate a win or `losing_evidence` to simulate a loss (Stripe testing docs, disputes section). Submit and wait for `charge.dispute.closed`.
5. Record the dispute id, staged evidence keys, submission time and closing status.

### Output
`dispute_runbook`.

### Quality Gate
- `stripe disputes retrieve dp_...` shows `evidence_details.submission_count` equal to `1` and `status` `won` for the winning test.
- The `disputes` row shows the closed status written by the webhook.

---

## Worked Example

Illustrative.

- Phase 1: card `...0259` paid 4900 USD; listen shows `charge.dispute.created [evt_...]`; row `dp_1Qp..., reason=fraudulent, due_by=2026-10-30T23:59:59Z`.
- Phase 2: evidence `{customer_name, customer_email_address, customer_purchase_ip, billing_address, uncategorized_text:"winning_evidence"}`.
- Phase 3: `Dispute.modify(..., submit=False)` then after review `submit=True`; `charge.dispute.closed` arrives; status `won`.

---

## Exit Criteria

DONE when disputes are tracked with deadlines, evidence is assembled by reason, staged with `submit=false`, submitted once after review, and the test dispute closes as expected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dispute has no linked order | **Adjust**: find it by `charge` then PaymentIntent metadata; add `order_id` metadata to future intents. |
| Phase 2 | Evidence file rejected | **Adjust**: convert to an allowed type and size per the File upload docs. |
| Phase 3 | Submitted by accident before review | **Return**: record it; evidence cannot be changed after submission. |
| Phase 3 | `due_by` passed | **Stop**: evidence can no longer be submitted; record the loss reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
