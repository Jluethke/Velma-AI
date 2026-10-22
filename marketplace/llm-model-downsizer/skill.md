# Llm Model Downsizer

Evaluate smaller or cheaper models for qualifying use cases.

## Inputs

- `usage-breakdown`: Current model usage
- `compressed-prompts`: Optimized prompts

## Outputs

- `model-recommendations`: Cheaper model alternatives per use case
- `quality-comparison`: Quality vs cost tradeoff for each switch

## Process

1. Identify use cases that do not need the largest model.
2. Test smaller models on each qualifying use case.
3. Compare quality and cost for each alternative.
4. Recommend the model for each use case.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
