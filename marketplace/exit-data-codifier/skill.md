# Exit Data Codifier

Code each exit interview into a structured record: stated reason for leaving (categorized), tenure at departure (months), team, manager, role, performance rating at last review, and any voluntary comments. The stated reason categories should be: compensation, growth, management, work-life balance, relocation, role fit, other opportunity, and unknown.

## Inputs

- `exit-interview-records`: Raw exit interview notes or transcripts for the analysis period
- `analysis-period`: The time window to analyze (e.g., past 24 months)

## Outputs

- `coded-exit-data`: Structured records for each departure with stated reason category, tenure, team, manager, role, and last performance rating
- `data-quality-notes`: Any gaps, inconsistencies, or biases in the data (e.g., exit interviews not conducted, high refusal rate)

## Process

1. For each departure in the analysis period, create a structured record with: name (anonymized for reporting), stated reason (coded to one of the 8 categories), tenure in months, team, direct manager, role title, and last performance rating.
2. If the stated reason does not fit cleanly into one category, code it as the primary category and note the secondary in comments.
3. Flag any departures where no exit interview was conducted. These are not missing at random. People who refuse exit interviews often have the strongest grievances.
4. Record the overall data quality: what percentage of departures have complete exit interviews? If below 70%, the data has a selection bias that limits the analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
