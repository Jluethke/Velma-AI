# Rag Retrieval Pipeline Builder

Build the retrieval pipeline with query processing and reranking.

## Inputs

- `vector-index`: Populated vector store
- `use-case`: Expected query patterns

## Outputs

- `retrieval-pipeline`: Query-to-context retrieval pipeline
- `retrieval-config`: Top-k, reranking, and filter settings

## Process

1. Implement query preprocessing (expansion, rewriting).
2. Configure top-k retrieval and similarity threshold.
3. Add reranking if precision matters more than latency.
4. Set metadata filters for scoped queries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
