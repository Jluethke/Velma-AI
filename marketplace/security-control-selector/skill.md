# Security Control Selector

Select security controls for each zone and boundary based on the trust model and requirements.

## Inputs

- `trust-model`: Trust zones and boundaries
- `security-requirements`: Requirements to satisfy
- `data-flow-diagram`: Flows crossing boundaries

## Outputs

- `control-matrix`: Security controls mapped to zones and boundaries (authentication, encryption, monitoring, access control)
- `control-rationale`: Justification for each control selection

## Process

1. For each trust boundary: select authentication and authorization controls
2. For data in transit: select encryption protocols and key management
3. For each zone: select monitoring and logging controls
4. Document why each control was chosen over alternatives

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
