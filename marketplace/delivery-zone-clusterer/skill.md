# Delivery Zone Clusterer

Cluster deliveries by geographic zone for route planning.

## Inputs

- `validated-addresses`: Geocoded and validated delivery addresses
- `time-window-assignments`: Delivery time windows assigned per order

## Outputs

- `delivery-clusters`: Orders grouped into geographic clusters
- `cluster-density-map`: Map of delivery density by zone

## Process

1. Group deliveries by geographic proximity
2. Balance cluster sizes against vehicle capacity
3. Respect time window constraints within each cluster
4. Produce the cluster assignments and density map

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
