# Structural Hole Finder

Identify the structural holes in your network: gaps between clusters where you could be the bridge, or where the absence of a bridge makes your network fragile.

## Inputs

- `network-graph`: Nodes, edges, and cluster annotations
- `cluster-map`: Natural clusters identified

## Outputs

- `structural-holes`: Pairs of clusters with no connection between them (or only a single fragile connection through you)
- `bridging-opportunities`: Specific introductions you could make to connect disconnected clusters, with the value proposition for both parties

## Process

1. For each pair of clusters, count the edges between them. Zero edges = a structural hole. One edge through you = a single-point-of-failure connection. Multiple edges = a well-connected bridge. A network with many structural holes means your value comes from being the connector, but it is also fragile.
2. Evaluate each structural hole: would connecting these clusters create value? Not every hole needs filling. Your college friends cluster and your dentist's referral cluster probably should stay disconnected. But your industry contacts cluster and your potential clients cluster being disconnected is a missed opportunity.
3. For valuable structural holes, identify specific introductions. The introduction must benefit both parties, not just you. 'Sarah in my fintech cluster needs a security auditor, and James in my cybersecurity cluster is looking for fintech clients' is a bridging introduction with value on both sides.
4. Prioritize holes where bridging creates the most network resilience. If you are the only connection between two important clusters, one broken relationship fractures your network. Building parallel bridges (introducing multiple people between the clusters) makes the network resilient.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
