# Yara Pattern Selector

Select the best patterns and conditions for the YARA rule based on uniqueness and stability.

## Inputs

- `unique-indicators`: Candidate strings, byte patterns, and structural features
- `sample-analysis-notes`: Notes on packing, obfuscation, and variants

## Outputs

- `selected-patterns`: Final set of patterns chosen for the rule
- `condition-logic`: Boolean condition combining the patterns

## Process

1. Select patterns that are present in all known samples and absent from a reference benign corpus
2. Choose a mix of string and byte patterns for resilience against minor variants
3. Design the condition logic: require N of M patterns to balance detection rate and specificity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
