# Deployment Risk Assessor

Assess the application architecture and risk tolerance to inform the deployment strategy selection.

## Inputs

- `application-architecture`: Description of the application and its components
- `deployment-requirements`: Uptime requirements, change frequency, and risk tolerance

## Outputs

- `risk-assessment`: Assessment of deployment risk factors
- `architecture-constraints`: Constraints on deployment from the architecture

## Process

1. Catalog the application components and their dependencies
2. Assess the impact of downtime on users and revenue
3. Identify stateful components that complicate rollback
4. Document the risk tolerance and acceptable deployment window

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
