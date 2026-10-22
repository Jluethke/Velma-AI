# Scoring Dimension Definer

Define the dimensions that make up the relationship score and the raw data behind each one.

## Inputs

- `scoring-context`: Whether this score is for personal networking, sales, customer success, or general purpose
- `available-data`: What interaction and contact data you have access to (CRM fields, email history, calendar, social media, phone logs)

## Outputs

- `dimension-definitions`: The 5 scoring dimensions with their data sources and calculation methods
- `data-gap-assessment`: Dimensions where data is incomplete and how to work around the gaps

## Process

1. Define 5 dimensions. Recency: days since last interaction (lower is better). Frequency: interactions per period in the measurement window. Mutual value: evidence of reciprocal exchange (they help you AND you help them, not one-way). Momentum: is the relationship accelerating (more frequent, deeper interactions) or decaying (less frequent, shallower)? Strategic importance: how critical is this contact to your goals independent of the current interaction pattern?
2. For each dimension, specify the raw data. Recency = max(last_outbound_date, last_inbound_date). Frequency = count of interactions in the last 90 days. Mutual value = count of value-exchange events (introductions made, favors done, insights shared) in both directions. Momentum = frequency in last 30 days divided by frequency in prior 60 days (above 1.0 = accelerating). Strategic importance = manual score on 1-5 scale updated quarterly.
3. Assess data gaps. Mutual value is the hardest to measure because value exchanges are often informal. If you do not have an interaction log with enough detail, approximate with initiation ratio (a balanced ratio suggests mutual value). If strategic importance feels arbitrary, define it by asking: 'if this person disappeared from my network tomorrow, what would I lose?'
4. Normalize each dimension to 0-100 scale using min-max normalization within your contact set. This ensures no dimension dominates because of unit differences.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
