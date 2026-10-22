# Review Execution Workflow

Define the review workflow: what the owner does on the review date, how to handle stale documents, and how to handle documents that should be retired.

## Inputs

- `ownership-assignments`: Document-to-owner map
- `review-cycle-schedule`: Review schedule by document

## Outputs

- `review-workflow`: Step-by-step workflow for the freshness review: confirm, update, flag, or retire
- `stale-document-handling`: Policy for stale documents: mark as stale (visible warning), update within 14 days, or retire if the process no longer exists

## Process

1. On the review date, the owner reads the document and answers: is this still accurate? A 5-minute check is usually enough.
2. If accurate: update the review date to the next cycle and confirm. If minor edits are needed (a name changed, a URL moved): fix them now. If major rewrite is needed: flag the document for revision with a description of what changed.
3. Flagged documents get a visible 'under revision' banner so readers know the content may be outdated. Set a 14-day deadline for the revision.
4. If the process described in the document no longer exists: retire the document. Move it to an archive with a note explaining when and why it was retired. Do not delete it; someone may need the historical reference.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
