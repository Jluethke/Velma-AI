# Osint Source Reliability Assessor

Assess the reliability and credibility of each source used in the investigation.

## Inputs

- `verified-findings`: Findings and their source provenance
- `source-metadata`: Provenance and timestamps for sources

## Outputs

- `source-reliability-ratings`: Each source rated by reliability (A through F) and information credibility (1 through 6)
- `confidence-assessment`: Overall confidence level for each key finding

## Process

1. Rate each source using the Admiralty/NATO reliability scale (A=reliable through F=unreliable)
2. Rate the information credibility (1=confirmed through 6=truth cannot be judged)
3. Compute composite confidence for each finding based on source ratings
4. Flag any findings that depend entirely on low-reliability sources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
