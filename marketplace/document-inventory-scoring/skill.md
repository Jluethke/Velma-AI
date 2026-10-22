# Document Inventory Scoring

Inventory all documentation and score each document for staleness. A document is stale when its content no longer matches reality.

## Inputs

- `documentation-locations`: All locations where documentation lives (wikis, drives, repos, intranets, shared folders)
- `documentation-scope`: What categories of documentation to include (procedures, policies, technical docs, guides, FAQs)

## Outputs

- `document-inventory`: Complete inventory of documentation: title, location, last updated, subject area, current staleness score
- `staleness-assessment`: Percentage of documentation that is current, stale, or unknown. Stale means the content does not match current reality.

## Process

1. Inventory all documentation across all locations. For each document, record: title, location (URL or path), last modification date, and subject area.
2. Score staleness: a document is current if a knowledgeable person confirms it matches reality. It is stale if any part no longer matches. It is unknown if nobody has checked.
3. Prioritize the staleness check by usage: high-traffic documents (those people actually reference) are checked first. Documents nobody reads can wait.
4. Calculate the freshness rate: current documents divided by total documents. Most organizations find a freshness rate below 50 percent, which means more than half their documentation cannot be trusted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
