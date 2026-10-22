# Adjuster Assigner

Assign the claim to an adjuster based on the claim type, severity, and geographic location.

## Inputs

- `claim-file`: The opened claim file with loss details
- `coverage-confirmation`: Verified coverage details

## Outputs

- `adjuster-assignment`: The assigned adjuster with contact information and target response time
- `investigation-plan`: Initial plan for the claim investigation (interviews, inspections, documentation needed)

## Process

1. Classify the claim by type (property, liability, auto, workers comp) and severity.
2. Select the adjuster based on expertise, workload, and location.
3. Set the investigation plan with required activities and timeline.
4. Notify the insured and claimant of the adjuster assignment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
