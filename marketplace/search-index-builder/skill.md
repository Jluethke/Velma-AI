# Search Index Builder

Build a search layer across all captured and organized material. Full-text search, tag search, date-range search, and project-scoped search. The search must work across all storage locations.

## Inputs

- `distillation-protocol`: The distillation method producing searchable summaries
- `retrieval-depth-guide`: The depth levels for retrieval

## Outputs

- `search-configuration`: Search setup covering full-text, tag, date, and project scope across all storage
- `findability-test-results`: Results of testing: can you find a known item within 30 seconds using search?

## Process

1. Verify that your storage tool supports full-text search. If not, switch to one that does. Full-text search is non-negotiable because perfect organization is impossible at scale.
2. Tag strategy: use a flat tag list (no hierarchy). Tags are for filtering search results, not for browsing. Keep the tag count under 30; merge any tag with fewer than 5 items into a broader tag.
3. Test the search: pick 10 items you captured in the last month. Try to find each one in under 30 seconds using only search (no browsing folders). Any item that takes longer than 30 seconds reveals a gap in metadata or search configuration.
4. Set up saved searches for your active projects so you can see everything related to a project in one view.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
