# Yara Detection Rate Tester

Test the YARA rule against a malware corpus to measure the true positive detection rate.

## Inputs

- `draft-yara-rule`: The YARA rule to test
- `fp-test-results`: False positive test results

## Outputs

- `detection-rate`: Percentage of target malware samples detected
- `missed-samples`: List of malware samples not detected with analysis of why

## Process

1. Scan the full malware corpus (target family plus related variants) with the rule
2. Calculate the detection rate: matches divided by total target samples
3. Analyze missed samples to determine if they are heavily packed, newer variants, or outliers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
