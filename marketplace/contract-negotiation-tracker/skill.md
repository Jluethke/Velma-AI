# Contract Negotiation Tracker

Track the negotiation of contract terms between the parties.

## Inputs

- `draft-contract`: The initial draft
- `key-terms-summary`: Key terms for reference during negotiation

## Outputs

- `negotiated-contract`: The contract with all negotiated changes incorporated
- `negotiation-log`: Log of all redline exchanges, positions, and concessions

## Process

1. Send the draft to the counterparty and track the redline exchange.
2. Log each round of changes: what was proposed, accepted, rejected, or countered.
3. Escalate sticking points to the business sponsor for guidance on acceptable concessions.
4. Produce the final negotiated version when both parties agree on all terms.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
