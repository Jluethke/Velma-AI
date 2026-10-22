# Fine Tune Model Selector

Select the base model and fine-tuning method.

## Inputs

- `task-definition`: What the fine-tuned model must do
- `data-report`: Dataset statistics

## Outputs

- `model-selection`: Selected base model and method (LoRA, QLoRA, full)
- `resource-estimate`: Estimated compute, memory, and cost

## Process

1. Evaluate candidate base models by capability and size.
2. Select the fine-tuning method based on dataset size and compute budget.
3. Estimate the GPU hours and memory requirements.
4. Document the selection rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
