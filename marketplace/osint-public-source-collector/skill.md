# Osint Public Source Collector

Collect information from public sources including social media, domain records, public filings, and breach databases.

## Inputs

- `intelligence-requirements`: Questions to answer from previous step
- `collection-plan`: Sources and schedule for collection
- `target-entities`: Entities to search for

## Outputs

- `raw-collection`: All collected data organized by source
- `source-metadata`: Provenance and timestamp for each data point

## Process

1. Query domain registration (WHOIS), DNS records, and certificate transparency logs
2. Search social media profiles, public posts, and archived pages
3. Check public records, corporate filings, and court documents
4. Search breach databases and paste sites for credential exposure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
