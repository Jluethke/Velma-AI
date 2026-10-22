# Freshness Owner Assignment

Assign a freshness owner to every document. The owner is not necessarily the author. The owner is the person best positioned to know when the content changes.

## Inputs

- `document-inventory`: Inventory of all documentation
- `staleness-assessment`: Current freshness rate

## Outputs

- `ownership-assignments`: Map of each document to its freshness owner, with the reasoning for each assignment
- `review-cycle-schedule`: Review schedule for each document based on volatility: 30 days for fast-changing topics, 90 days for moderate, 180 days for stable

## Process

1. For each document, assign the freshness owner: the person who works in the area the document covers and will notice when reality diverges from the documentation.
2. Set the review cycle based on volatility. Fast-changing topics (software configuration, process steps, team structure) get 30-day cycles. Moderate topics (policies, standards) get 90 days. Stable topics (legal requirements, architectural principles) get 180 days.
3. Cap each owner at 10 to 15 documents. More than that and the reviews will be rushed or skipped. If an owner has too many documents, split the assignment.
4. The owner's job is not to rewrite the document. It is to confirm 'this is still accurate' or flag 'this needs updating' and specify what changed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
