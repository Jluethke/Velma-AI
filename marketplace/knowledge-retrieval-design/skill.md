# Knowledge Retrieval Design

Design the retrieval system so people can find knowledge when they need it. The system must support three retrieval modes: I know what I am looking for (search), I know the topic area (browse), and I do not know what I need (guided discovery).

## Inputs

- `procedure-writing-guide`: Guide for writing testable procedures
- `documentation-priority-list`: Prioritized documentation list

## Outputs

- `retrieval-architecture`: Architecture supporting search, browse, and guided discovery across all three knowledge layers
- `knowledge-navigation-map`: Map showing how to find decisions, procedures, and case studies from any starting point

## Process

1. Search mode: full-text search across all three layers (procedures, decisions, case studies). Tag each item with function, topic, and date so search results can be filtered.
2. Browse mode: organize by function (engineering, sales, operations, finance) at the top level, then by topic within each function. Each function page is a curated starting point, not a dump of all documents.
3. Guided discovery: for each major process, create a 'start here' page that links to the procedure, the key decisions that shaped it, and the case studies that illustrate the edge cases.
4. Test retrieval: give 5 different people the same question ('How do we handle X?') and see if they find the same answer. If they find different answers, the retrieval system has a gap.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
