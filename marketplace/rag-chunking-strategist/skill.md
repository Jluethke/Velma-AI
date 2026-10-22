# Rag Chunking Strategist

Choose and implement the chunking strategy.

## Inputs

- `curated-corpus`: Document collection
- `use-case`: Expected query types

## Outputs

- `chunked-corpus`: Documents split into chunks
- `chunking-config`: Strategy, size, overlap, and metadata settings

## Process

1. Evaluate chunking strategies (fixed-size, semantic, recursive).
2. Select chunk size and overlap based on the query type.
3. Preserve document structure and metadata in chunks.
4. Test that chunks contain enough context to answer queries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
