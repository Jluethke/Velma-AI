# Alerting Channel Configurator

Set up alerting channels in the incident management platform with notification preferences and routing rules.

## Inputs

- `escalation-policies`: The configured escalation chains
- `platform-config`: Incident management platform settings and API access

## Outputs

- `alerting-channels`: Configured notification channels
- `routing-rules`: Rules mapping alert types to channels

## Process

1. Configure notification methods (phone, SMS, email, Slack, push)
2. Set up routing rules to direct alerts to the correct responder
3. Test each notification channel for delivery
4. Verify escalation triggers fire on schedule

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
