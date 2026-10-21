# Cross Source Correlator

Correlate events across multiple log sources to identify related activity.

## Inputs

- `normalized-logs`: Logs in common format ready for correlation
- `investigation-scope`: The investigation parameters to focus correlation

## Outputs

- `correlated-events`: Groups of related events linked across sources
- `correlation-gaps`: Time periods or systems where coverage is missing

## Process

1. Link events by shared identifiers (IP, user, session ID, hostname)
2. Identify temporal clusters of activity within sliding windows
3. Flag events that appear in one source but not a corroborating source
4. Document coverage gaps that limit the investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
