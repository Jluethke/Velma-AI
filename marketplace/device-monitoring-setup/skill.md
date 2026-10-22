# Device Monitoring Setup

Set up monitoring and alerting for the onboarded device.

## Inputs

- `telemetry-status`: Confirmation of data flow
- `device-record`: The registered device record

## Outputs

- `monitoring-config`: The monitoring and alerting configuration
- `onboarding-record`: The complete device onboarding record

## Process

1. Define the health metrics to monitor (connectivity, battery, signal strength, uptime).
2. Set the alert thresholds for each metric.
3. Configure the notification channels for alerts (email, SMS, webhook).
4. Compile the complete onboarding record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
