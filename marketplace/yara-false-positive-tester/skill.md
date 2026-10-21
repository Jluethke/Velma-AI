# Yara False Positive Tester

Test the YARA rule against a known-good corpus to measure the false positive rate.

## Inputs

- `draft-yara-rule`: The YARA rule to test
- `rule-documentation`: Documentation of the rule's intended target

## Outputs

- `fp-test-results`: False positive count and list of matching benign files
- `fp-analysis`: Analysis of why each false positive matched and how to fix it

## Process

1. Scan the known-good corpus (system files, common applications, documents) with the rule
2. Record every match and inspect why the benign file triggered the rule
3. Classify each false positive by cause: coincidental string match, common library code, or rule too broad

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
