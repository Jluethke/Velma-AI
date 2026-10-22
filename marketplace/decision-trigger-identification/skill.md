# Decision Trigger Identification

Identify which decisions deserve a log entry. Not every decision is worth logging. Define the criteria: decisions that set precedent, commit resources, are hard to reverse, or will be questioned later.

## Inputs

- `decision-record-template`: The six-field template
- `reasoning-quality-standard`: Quality calibration examples

## Outputs

- `decision-trigger-criteria`: Criteria for which decisions to log: resource commitment, reversibility, precedent-setting, likely-to-be-questioned
- `decision-capture-workflow`: The workflow for capturing a decision: who writes it, when, where it is stored, and who reviews it

## Process

1. A decision deserves a log entry if it meets any of these criteria: it commits resources (money, people, time) above a threshold, it is hard to reverse once implemented, it sets a precedent that future decisions will follow, or it will likely be questioned by someone who was not in the room.
2. Define the threshold for each criterion. For a small team, the resource threshold might be one person-week of effort. For a large organization, it might be $50,000. The reversibility threshold is: could we undo this in less than a day?
3. Define the capture workflow: the decision maker writes the record within 24 hours of the decision. A second person reviews the reasoning field for specificity. The record is stored in a searchable, shared location.
4. The anti-pattern: logging too many decisions. If every small choice gets logged, the log becomes unsearchable noise. Use the trigger criteria to keep the log focused.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
