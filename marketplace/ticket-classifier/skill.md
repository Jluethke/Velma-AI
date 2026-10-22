# Ticket Classifier

Classify incoming tickets by category and subcategory.

## Inputs

- `ticket-queue`: Incoming unclassified tickets
- `category-definitions`: Supported categories (bug, feature request, billing, how-to)

## Outputs

- `classified-tickets`: Tickets tagged with category and subcategory
- `classification-confidence`: Confidence scores for each classification

## Process

1. Read each ticket subject and body.
2. Match against category definitions using keyword and intent analysis.
3. Assign category, subcategory, and confidence score.
4. Flag low-confidence tickets for manual review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
