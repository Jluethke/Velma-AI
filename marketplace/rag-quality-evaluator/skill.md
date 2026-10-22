# Rag Quality Evaluator

Evaluate retrieval and generation quality end to end.

## Inputs

- `retrieval-pipeline`: Retrieval pipeline
- `generation-prompt`: Generation prompt

## Outputs

- `rag-eval-results`: Retrieval and generation quality scores
- `rag-design-document`: Full RAG system design document

## Process

1. Evaluate retrieval quality (recall@k, MRR, precision@k).
2. Evaluate generation quality (faithfulness, relevance, completeness).
3. Test for hallucination on questions with no relevant context.
4. Compile the full design document with architecture and metrics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
