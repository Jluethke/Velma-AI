# Nps Response Segmenter

Collect NPS responses and segment them into promoters, passives, and detractors.

## Inputs

- `nps-distribution-config`: The active survey distribution configuration
- `distribution-metrics`: Delivery and response rates

## Outputs

- `segmented-responses`: Responses categorized as promoter (9-10), passive (7-8), or detractor (0-6)
- `nps-score`: The calculated NPS score (percent promoters minus percent detractors)

## Process

1. Collect all responses and validate the data (remove duplicates, check for bots).
2. Segment each response: promoter (9-10), passive (7-8), detractor (0-6).
3. Calculate the NPS score: percent promoters minus percent detractors.
4. Tag each response with customer attributes (segment, tenure, product, region) for later analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
