# Detection Production Deployer

Deploy the detection to production with proper monitoring and alert routing.

## Inputs

- `detection-metrics`: Validated metrics for the detection
- `threshold-recommendations`: Recommended thresholds for production

## Outputs

- `deployed-detection`: Detection rule deployed to the production SIEM
- `alert-routing-config`: Configuration for how alerts from this detection are routed and prioritized

## Process

1. Configure the detection rule in the production SIEM with the validated thresholds
2. Set up alert routing to the appropriate SOC tier based on severity
3. Create the analyst runbook for investigating alerts from this detection
4. Enable monitoring of the detection's performance metrics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
