# Pivot Question Definer

Define the analysis question and identify the data source.

## Inputs

- `analysis-question`: The business question the pivot analysis should answer
- `available-datasets`: Datasets available for analysis with their schemas

## Outputs

- `question-definition`: Precisely stated question with the expected answer format (number, ranking, trend, comparison)
- `selected-dataset`: The dataset to use, with relevant columns identified

## Process

1. Restate the business question in precise, measurable terms.
2. Identify which dataset contains the data needed to answer the question.
3. Select the relevant columns from that dataset.
4. Note any filtering needed (date range, segment, status).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
