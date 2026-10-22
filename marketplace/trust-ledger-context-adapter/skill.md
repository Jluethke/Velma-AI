# Trust Ledger Context Adapter

Adapt the finished ledger to each relationship context so the same model runs correctly for personal, manager-and-report, client, and vendor relationships, and flag the cross-context cases where a withdrawal in one role draws down trust in another.

## Inputs

- `withdrawal-checklist`: The pre-withdrawal check
- `withdrawal-timing-rules`: When to delay a withdrawal versus proceed

## Outputs

- `context-adapted-ledgers`: The ledger tuned per context, with context-specific deposits, withdrawals, and power dynamics accounted for
- `cross-context-cautions`: Relationships spanning two contexts where a withdrawal in one role spends trust in the other

## Process

1. For manager-and-report relationships, account for power asymmetry. A withdrawal from a report (extra work, a hard review) costs more than the same ask between peers, because the report has less freedom to refuse, so the required balance is higher.
2. For client relationships, treat reliability and proactive communication as the heaviest deposits, and treat surprises (even good ones delivered badly) as withdrawals. Clients bank trust mostly through predictability.
3. For vendor relationships, remember the ledger runs both directions and often outlasts individuals. Deposits like paying on time and giving clear specifications build balance you will need when you ask for an exception later.
4. List the cross-context relationships and set a caution for each: a withdrawal you make as a manager can drain the balance you hold as a friend, and the person does not keep the two accounts as separate as you do. Decide in advance which role governs when they conflict.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
