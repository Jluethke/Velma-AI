# Paging Contact Verification

Verify that the incoming on-call's contact information is correct in the paging system.

## Inputs

- `handoff-record`: Completed handoff record
- `action-items`: Follow-up actions

## Outputs

- `contact-verification-result`: Confirmation that the paging system has correct contact info
- `on-call-handoff-report`: Final handoff report with verification status

## Process

1. Check that the paging system shows the incoming on-call as the current primary responder.
2. Send a test page to the incoming on-call and confirm receipt.
3. Verify the escalation path lists the correct backup contacts.
4. Record the verification result and close the handoff.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
