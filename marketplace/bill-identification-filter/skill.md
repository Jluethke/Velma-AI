# Bill Identification Filter

Identify and filter bills relevant to the organization.

## Inputs

- `policy-interests`: Topics, keywords, and committees relevant to the organization
- `legislative-session`: Congressional session or state legislature session to monitor

## Outputs

- `tracked-bills`: Bills flagged for monitoring with summary, sponsors, and committee assignment
- `priority-classification`: Each bill classified as high, medium, or low priority based on potential impact

## Process

1. Search newly introduced bills by keyword, committee, and sponsor.
2. Review each bill summary and classify by relevance to the organization's interests.
3. Assign a priority level based on potential impact and likelihood of advancement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
