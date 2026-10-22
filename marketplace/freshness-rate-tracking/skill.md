# Freshness Rate Tracking

Track the freshness rate over time. The rate is the percentage of documents that are within their review cycle. Below 80 percent means the maintenance system itself needs attention.

## Inputs

- `review-workflow`: The review execution workflow
- `stale-document-handling`: Policy for stale and retired documents

## Outputs

- `freshness-dashboard`: Dashboard showing: overall freshness rate, freshness by owner, overdue reviews, and trend over time
- `documentation-freshness-system-doc`: Complete system documentation: inventory method, ownership model, review cycles, workflow, staleness handling, and tracking metrics

## Process

1. Track the freshness rate monthly: documents reviewed on time divided by documents due for review. Target is 80 percent or higher.
2. Break down by owner: which owners are keeping up and which are falling behind? Falling-behind owners may have too many documents, unclear ownership, or unclear review criteria.
3. Track the trend: is the rate improving, stable, or declining? A declining rate is an early warning that the system is losing adoption.
4. Review the system itself quarterly: are the review cycles right? Are the ownership assignments still correct? Are new documents being added to the system? Adjust the system, not just the documents.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
