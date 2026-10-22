# Voice Metrics Definer

Define the voice analytics metrics to track.

## Inputs

- `analytics-goals`: What the organization wants to learn from voice data (quality, compliance, sentiment, efficiency)
- `data-sources`: Available voice data sources (call recordings, voicebot logs, IVR logs)

## Outputs

- `metrics-catalog`: Catalog of metrics: call duration, sentiment score, silence ratio, talk-over rate, compliance phrases, resolution indicator
- `data-requirements`: Data requirements for each metric (audio features, transcript fields, metadata)

## Process

1. List the analytics goals and map each to one or more measurable metrics.
2. Define each metric: what it measures, how it is calculated, and what data it needs.
3. Set the baseline and target for each metric.
4. Identify the data sources and confirm availability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
