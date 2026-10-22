# Dot Regulation Identifier

Identify the applicable DOT and FMCSA regulations for the operation.

## Inputs

- `operation-profile`: Description of the fleet operation (vehicle types, cargo, routes, interstate vs intrastate)
- `current-compliance-status`: Current state of compliance documentation and processes

## Outputs

- `applicable-regulations`: List of regulations that apply, organized by topic (hours of service, vehicle inspection, driver qualification, hazmat)
- `gap-assessment`: Gaps between current compliance and requirements

## Process

1. Determine the operating authority type and registration requirements.
2. Identify applicable FMCSA regulations based on vehicle class, cargo type, and operating radius.
3. Compare current practices against each regulation to identify gaps.
4. Prioritize gaps by regulatory risk and penalty exposure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
