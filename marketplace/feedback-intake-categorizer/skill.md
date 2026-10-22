# Feedback Intake Categorizer

Categorize incoming feedback by theme, urgency, and source channel.

## Inputs

- `raw-feedback`: Unprocessed feedback from all sources (surveys, reviews, tickets, social)
- `category-taxonomy`: The list of feedback categories and subcategories to classify into

## Outputs

- `categorized-feedback`: Each feedback item tagged with category, urgency, source, and sentiment
- `category-volume-summary`: Count of feedback items per category and urgency level

## Process

1. Ingest feedback from all configured sources into a single queue.
2. Classify each item by category (product, service, billing, documentation, other).
3. Assign urgency (critical, high, medium, low) based on sentiment and business impact.
4. Tag each item with source channel and date for tracking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
