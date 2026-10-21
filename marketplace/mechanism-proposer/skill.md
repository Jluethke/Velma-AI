# Mechanism Proposer

Synthesize all evidence into a coherent proposed mechanism with confidence assessment.

## Inputs

- `intermediate-catalog`: Detected intermediates and their temporal profiles
- `rate-law`: Kinetic rate expression
- `experimental-results`: Isotope labeling results

## Outputs

- `proposed-mechanism`: Arrow-pushing mechanism with elementary steps consistent with all evidence
- `evidence-summary`: Which evidence supports each step and what remains ambiguous

## Process

1. Write the elementary steps consistent with the rate law and observed intermediates
2. Verify that isotope labeling results match the proposed pathway
3. Check that the proposed rate-determining step matches the observed activation parameters
4. Identify any remaining ambiguities and suggest experiments to resolve them

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
