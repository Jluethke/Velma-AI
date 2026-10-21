# Threat Intel Relevance Analyzer

Analyze enriched intelligence for relevance to the organization's specific risk profile.

## Inputs

- `enriched-intel`: Intelligence with internal context and enrichment
- `internal-sightings`: Matches found in internal systems

## Outputs

- `relevance-assessment`: Each intelligence item rated for relevance to the organization
- `priority-intel-items`: High-relevance items requiring immediate action or attention

## Process

1. Score each item by relevance: does it target our industry, technology, geography, or known partners
2. Weight by confidence: source reliability, corroboration from multiple sources, recency
3. Identify items requiring immediate action (active campaigns targeting our sector)
4. Deprioritize items with low relevance or confidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
