# Subscriber Segmentation Builder

Segment the subscriber list by engagement level and demographic or behavioral attributes.

## Inputs

- `hygiene-policy`: The list hygiene standards
- `list-platform`: The email service provider

## Outputs

- `segment-definitions`: Named segments with inclusion criteria
- `segment-sizes`: Current count per segment

## Process

1. Create engagement-based segments: highly engaged (opened or clicked in last 30 days), engaged (last 90 days), at-risk (90 to 180 days), dormant (over 180 days).
2. Create attribute-based segments using available data (source, signup date, location, purchase history, interests).
3. Cross-reference engagement and attribute segments to identify high-value sub-groups.
4. Document the segment definitions and current counts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
