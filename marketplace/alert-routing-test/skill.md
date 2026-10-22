# Alert Routing Test

Test the alert routing configuration end to end.

## Inputs

- `quiet-hours-config`: Quiet hours and override configuration
- `escalation-rules`: Escalation rules

## Outputs

- `test-results`: Results of routing tests for each severity and channel combination
- `routing-setup-document`: Final alert routing setup document with all configurations

## Process

1. Send a test alert at each severity level and verify it arrives on the correct channel to the correct recipient.
2. Test the escalation path by letting a test alert go unacknowledged and verifying the escalation fires.
3. Test quiet hours by sending a non-critical alert during quiet hours and verifying suppression.
4. Test the override by sending a critical alert during quiet hours and verifying delivery.
5. Compile the test results and finalize the routing setup document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
