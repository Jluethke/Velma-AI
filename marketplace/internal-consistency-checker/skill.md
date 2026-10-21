# Internal Consistency Checker

Check the manuscript for internal consistency: numbers match between text and figures, methods cover every analysis, and claims in the abstract appear in the results.

## Inputs

- `abstract-text`: The abstract
- `methods-draft`: Methods section
- `results-draft`: Results section

## Outputs

- `consistency-report`: List of discrepancies found between sections
- `revision-checklist`: Items to fix before submission

## Process

1. Extract every number from the results and check it appears correctly in the abstract and figures.
2. Verify that every analysis in the results has its method described.
3. Check that every claim in the abstract has a corresponding result in the results section.
4. Flag any claim in the discussion not supported by a result in the results section.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
