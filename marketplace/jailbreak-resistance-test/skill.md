# Jailbreak Resistance Test

Test the LLM application against known jailbreak techniques and novel combinations.

## Inputs

- `application-endpoint`: URL or interface for the LLM application
- `filter-bypass-findings`: Filter bypass findings for building on

## Outputs

- `jailbreak-findings`: Successful jailbreak techniques and their impact
- `jailbreak-resistance-score`: Score for jailbreak resistance

## Process

1. Test published jailbreak techniques (DAN, grandma exploit, character persona, multi-turn)
2. Combine multiple weak techniques to test for cumulative bypass
3. Test for context window exhaustion followed by instruction override
4. Assess the severity of actions achievable through each successful jailbreak

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
