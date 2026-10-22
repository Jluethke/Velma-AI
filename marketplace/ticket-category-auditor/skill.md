# Ticket Category Auditor

Audit ticket categories to identify the most common issues.

## Inputs

- `ticket-history`: Historical support tickets with categories and resolution notes
- `time-range`: Period to analyze

## Outputs

- `category-frequency-report`: Categories ranked by ticket volume
- `top-issues-list`: Top issues suitable for knowledge base articles

## Process

1. Group tickets by category and subcategory.
2. Rank categories by volume.
3. Identify the top issues where a self-service article would reduce ticket volume.
4. Produce the category frequency report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
