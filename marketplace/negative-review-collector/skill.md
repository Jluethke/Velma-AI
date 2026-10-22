# Negative Review Collector

Collect the negative reviews and structure them for analysis. Extract: what the customer expected, what they got, and how they describe the gap.

## Inputs

- `review-source-map`: Where the reviews live
- `collection-plan`: How many to collect per competitor and platform

## Outputs

- `structured-reviews`: Each review broken into: competitor name, platform, star rating, what was expected, what was received, and the exact gap description in the reviewer's words
- `raw-language-bank`: The exact phrases and sentences customers used to describe their frustration, organized by theme

## Process

1. For each review, extract three things: (1) what the customer expected or was promised, (2) what they actually experienced, (3) how they describe the gap in their own words.
2. Copy the exact language. Do not paraphrase. The value is in the specific words customers choose, because those words are what other potential customers will search for and relate to.
3. Tag each review with the theme: missing feature, poor support, pricing mismatch, reliability problem, onboarding friction, or broken promise.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
