# Churn Intervention Designer

Design interventions for users who show churn signals. The intervention must address the behavior change, not just remind the user to stay.

## Inputs

- `validated-signals`: The predictive churn signals
- `churn-risk-scorecard`: The risk scoring system

## Outputs

- `intervention-playbook`: For each risk level: the intervention (personal outreach, feature education, special offer, product fix), the timing, and the channel
- `intervention-effectiveness-plan`: How to measure whether the intervention reduces churn: compare intervention group vs. control group

## Process

1. For high-risk users: personal outreach (a call or personal email) to understand what changed and whether you can help. This is the highest-touch, highest-impact intervention.
2. For medium-risk users: targeted communication based on the specific signal. If usage dropped, send a use-case guide. If a support ticket went unresolved, escalate it. If engagement shifted to fewer features, show related features.
3. For low-risk users: automated engagement (tips, case studies, new features) to maintain the relationship without personal touch.
4. Measure effectiveness: split the at-risk users into intervention and control groups. Compare their churn rates over 90 days. If the intervention group churns less, the intervention is working.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
