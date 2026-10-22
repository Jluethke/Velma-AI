# Guardrail Effectiveness Reviewer

Review and update guardrails based on enforcement data.

## Inputs

- `frequency-report`: Violation frequency data
- `top-triggered-list`: Most-triggered guardrails

## Outputs

- `guardrail-recommendations`: Recommendations to tighten, loosen, or retire guardrails
- `enforcement-report`: Complete guardrail enforcement report

## Process

1. Assess each high-frequency guardrail (is the rule too tight, or is the violation a real problem?).
2. Identify guardrails that never trigger (are they still needed, or is compliance universal?).
3. Draft recommendations (tighten, loosen, merge, retire, add new).
4. Produce the complete enforcement report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
