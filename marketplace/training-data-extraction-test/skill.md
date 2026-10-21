# Training Data Extraction Test

Test whether the LLM can be induced to reveal training data, fine-tuning data, or system prompts.

## Inputs

- `application-endpoint`: URL or interface for the LLM application
- `injection-findings`: Injection findings to inform extraction attempts

## Outputs

- `extraction-findings`: Training data or system prompts successfully extracted
- `memorization-risk-level`: Risk level for memorized data disclosure

## Process

1. Attempt to extract the system prompt through direct asking and indirect elicitation
2. Test for memorization of fine-tuning examples by probing with partial completions
3. Try divergence attacks to shift the model into reciting training data
4. Check whether the application leaks retrieval-augmented generation (RAG) source documents

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
