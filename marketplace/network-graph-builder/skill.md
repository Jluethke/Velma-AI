# Network Graph Builder

Build a graph representation of your network where nodes are contacts and edges represent known connections between them.

## Inputs

- `contact-list`: Your contacts with basic metadata (name, organization, role, how you know them)
- `known-connections`: Connections you know about between your contacts (who knows who, through what context)

## Outputs

- `network-graph`: A graph with nodes (contacts) and edges (connections), annotated with connection strength and context
- `cluster-map`: Natural clusters in your network identified by shared organizational, industry, or social context

## Process

1. Create a node for each contact. Annotate with: organization, industry, how you met, and your relationship strength (from your scoring model if available, or a simple strong/medium/weak classification).
2. Add edges between contacts you know are connected to each other. You do not need to map every connection, just the ones you are aware of. Include the connection context (coworkers, same conference, you introduced them, mutual friend). Edge strength mirrors the weakest of your relationships with the two nodes.
3. Run community detection on the graph. Even manually, you can identify clusters: your work colleagues form one cluster, your college friends another, your industry contacts another. Label each cluster by its primary context.
4. Note the contacts that appear in multiple clusters (they attend industry events AND are college friends). These are your bridge contacts. Also note clusters that are entirely disconnected from all other clusters (you are the only connection between these groups).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
