# Questionnaire Intake Parser

Parse the incoming questionnaire and categorize questions by control domain.

## Inputs

- `raw-questionnaire`: The vendor security questionnaire to complete
- `organization-profile`: Organization context for scoping answers

## Outputs

- `parsed-questions`: Questions categorized by domain (access control, encryption, etc.)
- `question-count-summary`: Summary of question counts by category

## Process

1. Extract all questions from the questionnaire format
2. Categorize each question by security domain
3. Identify questions that require evidence attachments
4. Flag questions that fall outside the organization's scope

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
