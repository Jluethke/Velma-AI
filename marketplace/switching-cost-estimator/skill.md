# Switching Cost Estimator

Estimate the cost and time to switch away from each concentrated vendor.

## Inputs

- `high-concentration-functions`: The functions with concentration risk
- `vendor-concentration-table`: The full vendor map

## Outputs

- `switching-analysis`: For each concentrated vendor: the estimated switching cost (dollars), switching time (weeks or months), and the switching risks (data migration, quality drop, integration rework)
- `concentration-risk-scores`: Each concentrated vendor scored by (switching cost plus switching time) relative to the function's criticality

## Process

1. For each concentrated vendor, estimate the switching cost: termination penalties, new vendor setup costs, data migration, integration rework, retraining, and lost productivity during transition.
2. Estimate the switching time: how long from decision to full operation with the new vendor? Include qualification, testing, and ramp-up.
3. Identify the switching risks: will quality drop during transition? Is there proprietary data or IP locked in the vendor's system? Are there regulatory or compliance implications?
4. Score by criticality: a high switching cost on a non-critical function is tolerable. A high switching cost on a critical function is a priority risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
