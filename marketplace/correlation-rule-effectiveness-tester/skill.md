# Correlation Rule Effectiveness Tester

Test each correlation rule for detection accuracy and false positive rate.

## Inputs

- `log-source-inventory`: Inventory of active log sources
- `siem-configuration`: SIEM configuration including rule definitions

## Outputs

- `rule-effectiveness-matrix`: Matrix showing each rule, its trigger rate, true positive rate, and false positive rate
- `noisy-rules`: Rules with unacceptable false positive rates

## Process

1. Catalog all active correlation rules and their trigger counts over the past 30 days
2. Sample triggered alerts and classify as true positive, false positive, or undetermined
3. Calculate the true positive and false positive rates for each rule
4. Identify rules that fire frequently but rarely produce actionable alerts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
