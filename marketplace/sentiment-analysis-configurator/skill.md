# Sentiment Analysis Configurator

Configure the sentiment analysis method for the incoming data.

## Inputs

- `source-connections`: Active data source connections
- `data-schema`: The unified data schema

## Outputs

- `analysis-config`: The configured sentiment analysis method (keyword, NLP, manual, hybrid)
- `sentiment-scores`: Scored sentiment data with positive, neutral, and negative labels

## Process

1. Select the analysis method: keyword matching for simple cases, NLP scoring for volume, manual tagging for precision.
2. Configure the scoring rules (scale, thresholds for positive/neutral/negative classification).
3. Run the analysis on historical data to validate accuracy against a hand-labeled sample.
4. Set up the processing pipeline to score new data as it arrives.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
