# Rag Embedding Indexer

Select the embedding model and vector store, then index the chunks.

## Inputs

- `chunked-corpus`: Chunked documents
- `use-case`: Query types and latency requirements

## Outputs

- `vector-index`: Populated vector store
- `index-config`: Embedding model, dimensions, and index parameters

## Process

1. Evaluate embedding models by task and language.
2. Select the vector store and configure the index.
3. Embed and load all chunks.
4. Verify index health and query latency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
