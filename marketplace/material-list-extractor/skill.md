# Material List Extractor

Extract the material list from the project documents.

## Inputs

- `project-documents`: Project drawings and specifications
- `project-schedule`: Construction schedule with activity dates

## Outputs

- `material-list`: List of materials needed with quantities and specifications
- `delivery-schedule`: Required delivery dates based on the construction schedule

## Process

1. Extract material quantities from the drawings and specifications.
2. Group materials by specification section and trade.
3. Set required delivery dates based on when each activity starts.
4. Flag long-lead items requiring early procurement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
