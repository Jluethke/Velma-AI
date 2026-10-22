# Apprenticeship Schedule Builder

Build the transfer schedule using the apprenticeship model: observe, assist, perform, teach. Each stage builds on the previous one.

## Inputs

- `tacit-knowledge-list`: The prioritized tacit knowledge to transfer
- `knowledge-receiver`: The receiver's current skill level

## Outputs

- `apprenticeship-schedule`: The stage-by-stage transfer plan: observe (watch the expert work and ask questions), assist (do the work with the expert present), perform (do the work independently with the expert available), teach (explain the work to someone else)
- `milestone-criteria`: How to know when the receiver is ready to move to the next stage

## Process

1. Stage 1 (Observe): the receiver watches the knowledge holder perform the work in real situations. The receiver asks questions and takes notes on the decisions, the exceptions, and the patterns. Duration: typically 1-2 weeks.
2. Stage 2 (Assist): the receiver performs parts of the work with the knowledge holder present and providing guidance. The knowledge holder corrects in real time. Duration: typically 2-4 weeks.
3. Stage 3 (Perform): the receiver performs the work independently. The knowledge holder is available for questions but does not intervene unless the receiver is about to make a significant error. Duration: typically 4-8 weeks.
4. Stage 4 (Teach): the receiver explains and demonstrates the work to a third person. Teaching is the strongest test of understanding. If the receiver can teach it, they own the knowledge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
