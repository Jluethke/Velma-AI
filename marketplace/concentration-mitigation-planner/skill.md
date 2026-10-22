# Concentration Mitigation Planner

Build a specific mitigation plan to reduce concentration: what new streams to build, how to reduce dependency on the largest, and the timeline.

## Inputs

- `vulnerability-map`: Vulnerability factors for each major stream
- `loss-scenario-table`: Loss scenarios with probabilities and timelines
- `concentration-assessment`: The current concentration level

## Outputs

- `mitigation-plan`: Specific actions to reduce concentration: which new revenue streams to develop, which existing streams to grow, and the target HHI after mitigation
- `revenue-concentration-report`: The complete concentration analysis: stream inventory, HHI score, vulnerability map, mitigation plan, and monitoring schedule

## Process

1. Set the target HHI: if currently above 0.50, target 0.25 within 24 months. If between 0.25 and 0.50, target 0.15 within 18 months. If between 0.15 and 0.25, target staying below 0.25.
2. Calculate how much revenue from new or grown streams is needed to hit the target HHI. Work backward: if the largest stream stays flat, how much total revenue from other streams would bring the HHI to the target?
3. Identify the most achievable new streams based on existing skills, assets, and relationships. Prioritize streams that are uncorrelated with the largest current stream (if you lose one, you don't lose both).
4. Set milestones: where should each new stream be at 6, 12, and 24 months? Define the leading indicators (pipeline, proposals, trials) that predict whether the stream will hit its revenue target. Produce the full report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
