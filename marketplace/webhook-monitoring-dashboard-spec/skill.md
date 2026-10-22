# Webhook Monitoring Dashboard Spec

Design the monitoring and debugging tools for webhook delivery.

## Inputs

- `delivery-spec`: How deliveries are processed
- `retry-policy`: Retry and failure rules

## Outputs

- `monitoring-spec`: Dashboard showing delivery success rates, latencies, and failures by subscriber
- `webhook-system-doc`: Complete webhook system documentation for both providers and consumers

## Process

1. Design a delivery log showing each attempt: timestamp, event, subscriber, HTTP status, latency.
2. Build a dashboard view: success rate by subscriber, by event type, over time.
3. Add alerting for subscribers whose failure rate exceeds the threshold.
4. Write consumer-facing documentation: how to register, verify signatures, handle retries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
