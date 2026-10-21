# Reference Formatter

Format all in-text citations and the reference list according to the target journal's style.

## Inputs

- `manuscript-draft`: Combined manuscript text with informal citations
- `target-journal-style`: Citation style name or journal formatting guide

## Outputs

- `formatted-references`: Reference list in the correct journal style
- `citation-check`: Report of any missing references, duplicates, or uncited entries

## Process

1. Parse all in-text citations from the manuscript.
2. Match each citation to a reference entry.
3. Format each reference according to the target style (author-date, numbered, Vancouver).
4. Report any citations without a reference or references never cited.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
