# Structured Field Parser

Parse the raw OCR text into structured fields based on the document layout.

## Inputs

- `raw-ocr-text`: Raw text with position data from OCR
- `ocr-confidence-map`: Confidence scores for each text region

## Outputs

- `structured-data`: Parsed fields (names, dates, amounts, addresses, reference numbers)
- `low-confidence-flags`: Fields with low confidence that need human review

## Process

1. Identify field labels and their associated values using layout analysis.
2. Parse dates, amounts, and reference numbers into their data types.
3. Validate extracted values against expected formats (date patterns, numeric ranges).
4. Flag any fields below the confidence threshold for human review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
