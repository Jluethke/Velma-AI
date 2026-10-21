# Threat Intel Enricher

Enrich normalized intelligence with internal context and additional external data.

## Inputs

- `normalized-intel`: Standardized intelligence objects
- `dedup-report`: Deduplication results

## Outputs

- `enriched-intel`: Intelligence enriched with sighting data, asset context, and related indicators
- `internal-sightings`: Matches found in internal logs and historical incident data

## Process

1. Check indicators against internal logs for historical sightings
2. Enrich IP addresses and domains with WHOIS, geolocation, and reputation data
3. Link indicators to known campaigns, threat actors, and ATT&CK techniques
4. Flag any indicators that match assets or users in the environment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
