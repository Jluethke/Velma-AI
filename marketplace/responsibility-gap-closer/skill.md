# Responsibility Gap Closer

Close the responsibility gap. At every moment, exactly one party owns the item. During the handoff itself, ownership must be explicit. If both parties think the other is responsible, the item is orphaned.

## Inputs

- `handoff-map`: All handoffs
- `information-requirements`: What transfers at each handoff

## Outputs

- `ownership-protocol`: For each handoff, the moment ownership transfers (a specific action, not a time), and who owns it during the transition
- `orphan-prevention-rules`: Rules that prevent items from existing without an owner

## Process

1. For each handoff, define the exact action that transfers ownership: the sender marks the item as handed off, the receiver acknowledges receipt.
2. Until the receiver acknowledges, the sender still owns it. This is the critical rule: ownership does not leave the sender until the receiver confirms.
3. If the receiver does not acknowledge within a defined time, the item stays with the sender and an escalation triggers.
4. Items in queues, inboxes, or shared spaces must have a named owner or a triage step that assigns one immediately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
