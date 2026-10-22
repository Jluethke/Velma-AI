# Metadata At Capture Protocol

Define the metadata to add at capture time. The metadata makes items findable without requiring perfect filing. Rich metadata on a flat store beats a deep hierarchy with no metadata.

## Inputs

- `flat-store-structure`: The flat store with two levels
- `migration-plan`: Plan for moving existing files

## Outputs

- `metadata-schema`: The metadata fields to add at capture time: date, source, project, type, and up to 3 free tags
- `tagging-discipline`: Rules for tagging: use existing tags first, keep the total tag count under 30, merge low-use tags quarterly

## Process

1. Required metadata at capture: date (automatic), source (where it came from), project (which active project it relates to), and type (document, note, email, image, reference).
2. Optional metadata: up to 3 free tags. Tags are for filtering search results, not for browsing. Use existing tags before creating new ones.
3. Keep the tag list under 30 total tags. More than 30 means you are over-categorizing. Every quarter, review the tag list and merge any tag with fewer than 5 items into a broader tag.
4. The metadata must take under 15 seconds to add. If it takes longer, you will skip it, and the system degrades.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
