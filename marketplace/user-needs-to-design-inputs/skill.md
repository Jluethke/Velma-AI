# User Needs To Design Inputs

Translate user needs and clinical requirements into measurable design input specifications with acceptance criteria, linking each input to the originating need.

## Inputs

- `intended-use-statement`: Description of the device's intended use, indications, patient population, and use environment
- `user-needs-list`: Raw list of user needs gathered from clinicians, patients, and stakeholders
- `predicate-device-analysis`: Analysis of similar legally marketed devices and their specifications

## Outputs

- `design-input-specifications`: Measurable requirements with acceptance criteria, each traced to a user need
- `design-input-traceability`: Matrix linking each design input to its originating user need and applicable standard

## Process

1. For each user need, define one or more measurable requirements. A need like 'easy to hold' becomes 'grip force less than 10N for 95th percentile hand' with a specific test method.
2. Identify applicable standards and extract requirements from them. IEC 60601-1 for electrical safety, ISO 10993 for biocompatibility, IEC 62366 for usability. Each standard clause that applies becomes a design input.
3. For performance requirements, define acceptance criteria that are testable: a number, a pass/fail condition, or a reference to a standard test method. Avoid subjective language.
4. Cross-reference predicate device specifications. Any specification you choose that is less stringent than the predicate needs a documented rationale.
5. Build the traceability matrix: user need to design input to verification method. Every user need must trace to at least one design input. Every design input must have an assigned verification method.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
