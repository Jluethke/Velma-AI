# Information Gap Closer

Close the information gap at each handoff. The receiver must have everything they need to act without asking the sender. If the receiver has to ask a question, the handoff is incomplete.

## Inputs

- `handoff-map`: All handoffs in the process
- `failure-prone-handoffs`: Handoffs with known or likely failures

## Outputs

- `information-requirements`: For each handoff, the minimum information the receiver needs to act, presented as a checklist
- `information-delivery-method`: How the information will be packaged and delivered (template, form, structured ticket, standard fields)

## Process

1. For each handoff, ask the receiver: what do you need to know from the sender to do your part? List every item.
2. For each item, check: is it currently included in the handoff? If not, add it to the handoff template.
3. Structure the information as a checklist or form, not free text. Free text allows omissions; structured fields do not.
4. Test: give the receiver only the handoff package (no access to the sender). Can they act? If not, the package is incomplete.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
