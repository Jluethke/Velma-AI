# Approval Tracker

Track approval status, send reminders, and handle rejections or resubmissions.

## Inputs

- `submission-record`: The pending approval submission
- `approval-sla`: SLA expectations for response

## Outputs

- `approval-outcome`: Approved, rejected, or returned for revision with approver comments
- `approval-audit-trail`: Complete audit trail: submission, reminders, decision, timestamp

## Process

1. Monitor the approval queue for responses.
2. Send reminders when the SLA deadline approaches.
3. Record the approval decision with the approver's comments.
4. If rejected, route back to the submitter with feedback for revision.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
