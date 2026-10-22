# Sli Selector

Select the service level indicators for each critical journey (availability, latency, throughput, correctness).

## Inputs

- `critical-journeys`: The critical user journeys
- `journey-metrics-map`: Map of journeys to measurable metrics

## Outputs

- `sli-definitions`: Defined SLIs with measurement methods
- `sli-data-sources`: Where each SLI is measured from

## Process

1. Select the SLI type for each journey (availability, latency percentile, error ratio)
2. Define the measurement method (server-side, client-side, synthetic)
3. Specify the data source and query for each SLI
4. Validate that each SLI accurately reflects user experience

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
