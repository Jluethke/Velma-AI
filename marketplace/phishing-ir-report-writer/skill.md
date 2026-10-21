# Phishing Ir Report Writer

Produce the phishing incident response report with impact assessment and recommendations.

## Inputs

- `block-confirmation`: Record of all defensive actions taken
- `interaction-list`: Users who interacted with the phishing email

## Outputs

- `phishing-ir-report`: Complete phishing incident response report
- `awareness-recommendations`: Targeted training recommendations based on the incident

## Process

1. Compile the timeline from delivery through containment
2. Summarize the impact (number of recipients, number who interacted, credentials compromised)
3. Document the phishing TTPs and indicators for threat intelligence sharing
4. Recommend targeted awareness training for users who interacted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
