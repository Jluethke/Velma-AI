# Incident Response Plan Tester

Test the ransomware incident response plan through a tabletop exercise.

## Inputs

- `segmentation-test-results`: Blast radius analysis
- `backup-test-results`: Backup recovery test results
- `edr-coverage-findings`: Detection coverage status

## Outputs

- `tabletop-results`: Gaps and delays identified during the tabletop exercise
- `plan-readiness-score`: Overall readiness score with category breakdowns

## Process

1. Run a ransomware scenario tabletop exercise with the IR team
2. Time key decisions (contain, notify, pay/no-pay, restore) and identify bottlenecks
3. Check whether communication plans and contact lists are current
4. Assess whether the team can execute the response without external help within the target timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
