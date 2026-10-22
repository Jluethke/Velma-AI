# Failure Injection Selector

Select and configure the failure injection type, scope, and blast radius for the experiment.

## Inputs

- `target-system`: The system to experiment on
- `steady-state-hypothesis`: The defined normal behavior metrics

## Outputs

- `injection-plan`: The selected failure type and configuration
- `blast-radius-scope`: The defined scope and limits of the experiment

## Process

1. Select the failure type (network partition, process kill, CPU stress, disk full, latency injection)
2. Define the blast radius (which instances, percentage of traffic)
3. Set safety limits and automatic rollback triggers
4. Document the injection configuration and tooling

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
