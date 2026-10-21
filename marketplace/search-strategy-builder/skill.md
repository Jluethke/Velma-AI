# Search Strategy Builder

Build a reproducible search strategy with Boolean operators, MeSH terms, and database selection.

## Inputs

- `structured-question`: PICO-formatted review question
- `inclusion-criteria`: criteria for study inclusion

## Outputs

- `search-strings`: Boolean search strings per database
- `database-list`: selected databases and registries to search
- `search-log`: dated log of each search execution and hit count

## Process

1. Identify synonyms, MeSH/EMTREE terms, and free-text keywords for each PICO element
2. Combine terms with Boolean operators (AND across elements, OR within elements)
3. Adapt the master string to each database's syntax (PubMed, Embase, Cochrane, etc.)
4. Execute searches and record hit counts, dates, and any filters applied

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
