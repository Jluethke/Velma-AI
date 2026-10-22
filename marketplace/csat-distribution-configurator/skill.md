# Csat Distribution Configurator

Configure the automated CSAT survey distribution at each touchpoint.

## Inputs

- `csat-touchpoint-map`: Touchpoints with triggers, questions, and targets

## Outputs

- `csat-automation-config`: The configured survey triggers and distribution rules
- `suppression-rules`: Rules to prevent survey fatigue (frequency caps, opt-outs)

## Process

1. Configure the trigger event for each touchpoint (ticket close, onboarding complete, renewal date).
2. Set the delay between event and survey (immediate, 1 hour, 24 hours) based on the touchpoint.
3. Define suppression rules: maximum one CSAT survey per customer per 30 days.
4. Test the automation with sample events to verify triggers fire correctly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
