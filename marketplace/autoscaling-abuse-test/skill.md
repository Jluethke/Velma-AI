# Autoscaling Abuse Test

Test whether autoscaling can be abused to cause cost escalation or resource exhaustion.

## Inputs

- `cluster-access`: Access to the cluster and cloud billing
- `architecture-diagram`: Service architecture for load testing targets

## Outputs

- `autoscaling-findings`: Autoscaling abuse vectors and cost impact estimates
- `resource-limit-status`: Whether resource quotas and scaling limits are configured

## Process

1. Review HPA, VPA, and cluster autoscaler configurations and limits
2. Check for maximum replica counts and resource quotas per namespace
3. Estimate the cost impact of scaling to the configured maximum
4. Test whether a small number of crafted requests can trigger rapid scaling

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
