# Sharing As Side Effect Design

Design the sharing mechanism as a side effect of the existing workflow, not a separate activity. The key: the person doing the work writes the knowledge artifact as part of completing the work, not as an extra step afterward.

## Inputs

- `sharing-opportunity-map`: Workflows mapped to their knowledge production
- `highest-value-sharing-points`: Top 5 workflow points selected for sharing

## Outputs

- `sharing-mechanisms`: For each of the top 5 workflows: the specific sharing artifact produced, the template, and who writes it
- `definition-of-done-updates`: Updated definitions of done that include the sharing artifact (the work is not done until the knowledge is captured)

## Process

1. For each selected workflow, define the sharing artifact: code reviews produce a 'lessons learned' field (one sentence: what the reviewer learned), incidents produce a case study (5 sections: what happened, why, impact, fix, prevention), project closes produce a handoff document.
2. Embed the artifact into the definition of done. The code review is not approved until the lessons field is filled. The incident is not closed until the case study is written. The project is not complete until the handoff is filed.
3. Keep the artifact small. A one-sentence lesson from a code review takes 30 seconds to write. A 5-section incident case study takes 15 minutes. A handoff document takes 30 minutes. If it takes longer, the template is too complex.
4. Store the artifacts where people will find them: alongside the code (for code review lessons), in the incident log (for case studies), in the project archive (for handoffs).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
