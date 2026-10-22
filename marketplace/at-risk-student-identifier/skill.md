# At Risk Student Identifier

Identify at-risk students using early warning indicators from institutional data.

## Inputs

- `student-data`: Enrollment, attendance, grade, and engagement data
- `risk-thresholds`: Thresholds for flagging students (e.g., below 70%, two missed classes)

## Outputs

- `at-risk-list`: List of students flagged with their risk indicators
- `risk-summary`: Summary statistics of at-risk population

## Process

1. Pull current data on attendance, grades, and engagement
2. Apply the risk thresholds to flag students
3. Categorize by risk level (high, medium, low)
4. Produce the at-risk list and summary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
