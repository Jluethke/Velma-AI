# Resilience Metrics Definition

Define quantitative resilience metrics covering absorptive capacity, adaptive capacity, and restorative capacity.

## Inputs

- `system-functions`: List of system functions with their performance metrics
- `stakeholder-resilience-needs`: What stakeholders consider acceptable degradation and recovery time

## Outputs

- `resilience-metric-set`: Defined metrics with measurement method, baseline values, and acceptable thresholds
- `resilience-profile-template`: Template for plotting system performance vs time through disruption-degradation-recovery cycle

## Process

1. Define the performance function Q(t): the normalized performance level (0 = total loss, 1 = full nominal) as a function of time. The resilience profile is the shape of Q(t) through a disruption event.
2. Define absorptive capacity metrics: the minimum performance level Q_min during disruption (how deep the dip is), and the performance drop rate dQ/dt during the disruption onset (how fast performance degrades). A system that degrades slowly absorbs the disruption better.
3. Define adaptive capacity metrics: the steady-state performance level Q_adapted during sustained disruption (after initial transient but before recovery). This measures whether the system can find a new operating mode that delivers partial capability.
4. Define restorative capacity metrics: time to recover to 90% of nominal (T_90), and recovery rate dQ/dt during restoration. Also define the resilience integral: the area between the nominal performance line and the actual Q(t) curve, which captures total performance loss over the disruption lifecycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
