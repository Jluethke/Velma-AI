# Log Source Inventory Profiler

Inventory all log sources feeding the SIEM and profile their ingestion rates and reliability.

## Inputs

- `siem-configuration`: Current SIEM configuration and data source list
- `environment-topology`: Network and system topology of the monitored environment

## Outputs

- `log-source-inventory`: Complete inventory of log sources with ingestion rates and gaps
- `coverage-gaps`: Systems or services not sending logs to the SIEM

## Process

1. Extract the list of all configured log sources from the SIEM
2. Compare against the environment topology to find systems not sending logs
3. Measure ingestion rate, latency, and parse failure rate for each source
4. Flag any sources with intermittent delivery or high error rates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
