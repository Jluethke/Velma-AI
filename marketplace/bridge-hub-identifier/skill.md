# Bridge Hub Identifier

Identify bridges (nodes connecting otherwise separate communities) and hubs (highly connected nodes within communities).

## Inputs

- `network-graph`: The constructed graph
- `community-assignments`: Community membership for each node
- `centrality-table`: Centrality scores

## Outputs

- `bridge-nodes`: Nodes with high betweenness that connect different communities
- `hub-nodes`: Nodes with high degree or eigenvector centrality within their community

## Process

1. Identify nodes with high betweenness centrality whose neighbors span multiple communities.
2. Identify nodes with high within-community degree (local hubs).
3. Classify each node's structural role: peripheral, hub, bridge, or bridge-hub.
4. Note any nodes whose removal would disconnect communities.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
