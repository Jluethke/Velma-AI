# Original Protocol Extractor

Extract the complete experimental protocol from a published paper, noting any ambiguities, missing details, or unreported decisions.

## Inputs

- `target-paper`: Citation and full text of the study to be replicated
- `supplementary-materials`: Any supplementary files, data, or code from the original study
- `author-contact`: Correspondence with original authors if clarifications are needed

## Outputs

- `extracted-protocol`: Step-by-step protocol as described in the paper with section references
- `ambiguity-log`: List of unclear or missing procedural details that require decisions
- `materials-list`: All materials, instruments, software, and stimuli used in the original study

## Process

1. Read the methods section line by line and extract each procedural step
2. Cross-reference with supplementary materials for additional procedural detail
3. Document every point where the methods description is ambiguous or incomplete
4. Contact original authors to resolve critical ambiguities if possible
5. Compile the complete materials and equipment list with model numbers and versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
