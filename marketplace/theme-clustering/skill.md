# Theme Clustering

Group the extracted complaints into a small set of clear themes with definitions.

## Inputs

- `complaint-statements`: Extracted complaint sentences

## Outputs

- `complaint-themes`: A set of themes, each holding related complaints
- `theme-definitions`: A one-line definition of each theme so the boundaries are clear

## Process

1. Sort the complaints into groups where each group shares a root problem.
2. Keep the number of themes small, usually five to nine, so the signal stays readable.
3. Write a one-line definition for each theme that states what belongs in it and what does not.
4. Reassign any complaint that could sit in two themes to the one its root cause fits best.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
