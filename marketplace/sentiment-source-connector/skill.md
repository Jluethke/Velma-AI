# Sentiment Source Connector

Define and connect the sentiment data sources.

## Inputs

- `sentiment-sources`: The sources to track (surveys, reviews, social mentions, support tickets)
- `tracking-scope`: What to track sentiment about (brand, product, feature, competitor)

## Outputs

- `source-connections`: Configured connections to each sentiment data source
- `data-schema`: The unified data schema for sentiment records (text, source, date, score)

## Process

1. List all sources that produce text with sentiment signal (surveys, reviews, social, tickets, app feedback).
2. Configure the data connection for each source (API, export, webhook, manual import).
3. Define the unified schema: text, source, date, customer or author, product area, raw sentiment.
4. Test each connection and verify data is flowing into the unified store.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
