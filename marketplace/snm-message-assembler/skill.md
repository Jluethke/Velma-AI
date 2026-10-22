# Snm Message Assembler

Assemble the full message with one apology at most and no over-explaining. The parts are acknowledgment, clear no, brief reason, and alternative if real. The final pass removes the extra apologies and the nervous padding that turn a respectful no into a plea for permission.

## Inputs

- `acknowledgment-line`: The opening that shows you took the request seriously
- `no-statement`: The clear no
- `brief-reason`: The one short real reason
- `alternative-offer`: The real alternative, or the note that there is none

## Outputs

- `final-no-message`: The assembled message: acknowledgment, no, reason, and alternative where real
- `apology-count-check`: A check confirming at most one apology and no padding that undercuts the no

## Process

1. Assemble in order: acknowledgment, no, brief reason, alternative if one is real.
2. Count the apologies. One 'I am sorry' is courteous. Three signals you think you owe a debt for declining, which invites pushback.
3. Cut the padding: 'I really hope this is okay,' 'please do not be upset,' 'I feel terrible.' These ask the person to reassure you and reopen the matter.
4. Read it once. If it still sounds like you are asking permission to say no, trim until it sounds like a decision stated with respect.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
