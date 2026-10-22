# Post Mortem Follow Through Tracker

Track the fixes to completion. A post-mortem without follow-through is a therapy session: it feels good but nothing changes.

## Inputs

- `systemic-fixes`: The fixes with owners and deadlines
- `fix-verification-plan`: The verification methods

## Outputs

- `fix-tracking-log`: The status of each fix: assigned, in progress, implemented, verified. Updated weekly until all fixes are verified.
- `post-mortem-document`: The complete post-mortem document: timeline, root causes, fixes, and verification results. Stored where future teams can find it.

## Process

1. Track each fix weekly: is it still on schedule? Has the owner started? Are there blockers?
2. When a fix is implemented, run the verification. If it passes, mark it as verified and close it. If it fails, iterate on the design.
3. Compile the complete post-mortem document. Store it in a searchable location. When a similar situation arises in the future, the first step should be: 'Has this happened before? What did we learn?'
4. Close the post-mortem when all fixes are verified. Report the closure to the participants and stakeholders. The post-mortem cycle is: timeline, root cause, fix, verify, close.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
