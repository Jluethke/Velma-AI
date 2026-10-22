# Vector Platform Selector

Evaluate and select the vector database platform.

## Inputs

- `requirements-doc`: Requirements
- `query-patterns`: Expected usage patterns

## Outputs

- `platform-selection`: Selected database with justification
- `comparison-matrix`: Evaluation of candidates against requirements

## Process

1. Evaluate candidates (Pinecone, Weaviate, Qdrant, pgvector, Milvus).
2. Score each against the requirements.
3. Consider operational complexity and cost.
4. Document the selection rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
