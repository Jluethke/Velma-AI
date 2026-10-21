# Dark Web Source Selector

Select and configure the collection sources including forums, marketplaces, paste sites, and Telegram channels.

## Inputs

- `monitoring-requirements`: What to search for
- `collection-targets`: Where to search

## Outputs

- `source-configuration`: Configured collection sources with access credentials and scraping rules
- `alerting-rules`: Keyword and pattern match rules for automated alerting

## Process

1. Evaluate available dark web monitoring platforms and their source coverage
2. Configure keyword-based alerting rules for each monitoring requirement
3. Set collection frequency and deduplication rules
4. Test the configuration against known historical hits

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
