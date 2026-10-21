# Threat Intel Normalizer

Normalize collected intelligence into a standard format with consistent taxonomy.

## Inputs

- `raw-intel-collection`: Raw indicators and reports from multiple sources
- `source-reliability-scores`: Source reliability ratings

## Outputs

- `normalized-intel`: Intelligence in standard format (STIX objects) with consistent naming
- `dedup-report`: Report of duplicate indicators merged and conflicting data resolved

## Process

1. Convert all indicators to a standard format (STIX 2.1 objects)
2. Apply consistent taxonomy for threat actors, malware families, and techniques
3. Deduplicate indicators from multiple sources and resolve conflicting metadata
4. Apply source reliability weighting

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
