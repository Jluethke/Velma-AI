# Phishing Simulation Execution

Execute phishing email campaigns against target groups and track open rates, click rates, and credential submissions.

## Inputs

- `phishing-materials`: Email templates and landing pages
- `target-groups`: Employee groups to target

## Outputs

- `phishing-metrics`: Open rate, click rate, and credential submission rate per campaign
- `reporter-metrics`: Rate at which employees reported the phishing attempt

## Process

1. Deploy the phishing infrastructure (sending domain, tracking, landing pages).
2. Send phishing emails to target groups according to the approved schedule.
3. Track email opens, link clicks, credential submissions, and attachment downloads.
4. Record which employees reported the email through proper channels.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
