# Cookie Classification

Classify each cookie and tracker by category and purpose.

## Inputs

- `cookie-inventory`: List of all cookies found
- `tracker-inventory`: List of third-party trackers

## Outputs

- `classified-cookies`: Each cookie classified into a category (necessary, preferences, analytics, marketing) with a stated purpose
- `unknown-cookies`: Cookies that could not be automatically classified for manual review

## Process

1. Match each cookie against known cookie databases to identify its purpose and owner.
2. Classify each cookie into a consent category (strictly necessary, functional, analytics, advertising).
3. Flag any cookies that cannot be automatically classified for manual review.
4. Verify that the classifications match the categories declared in the consent banner.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
