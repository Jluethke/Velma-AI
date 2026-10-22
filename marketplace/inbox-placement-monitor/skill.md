# Inbox Placement Monitor

Monitor inbox placement rates across major mailbox providers.

## Inputs

- `warmup-metrics`: Metrics from the warmup period

## Outputs

- `placement-report`: Inbox vs spam vs missing placement rates by mailbox provider
- `deliverability-report`: Full deliverability optimization report with infrastructure, content, warmup, and placement findings

## Process

1. Measure inbox placement rates by provider (Gmail, Outlook, Yahoo, Apple Mail).
2. Identify providers where placement is below target.
3. Diagnose the cause (reputation, content, authentication, engagement).
4. Recommend corrective actions per provider.
5. Compile the full deliverability report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
