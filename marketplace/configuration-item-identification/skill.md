# Configuration Item Identification

Select which system elements become configuration items based on criteria that balance control overhead against risk of uncontrolled changes.

## Inputs

- `system-architecture`: System decomposition showing all hardware assemblies, software components, and firmware
- `program-risk-profile`: Risk areas: safety-critical elements, cross-organization interfaces, long-lead items, items with known reliability concerns

## Outputs

- `ci-list`: Every configuration item with unique identifier, description, CI level (system, subsystem, unit), managing organization, and the criteria that qualified it as a CI
- `ci-naming-convention`: Part numbering scheme encoding the product, variant, revision, and dash number for hardware, and the equivalent versioning scheme for software and firmware
- `document-ci-list`: Configuration-controlled documents: specifications, drawings, ICDs, test procedures, with their document numbers and revision control method

## Process

1. Apply CI selection criteria. An item should be a CI if it: interfaces with another organization's product, is safety-critical, is a separately deliverable end item, requires its own qualification testing, has interchangeability requirements, or is a long-lead procurement item. Not everything needs to be a CI. Over-controlling increases overhead without reducing risk.
2. Assign unique identifiers that encode useful information. A typical hardware part number: PPP-SSS-UUU-VVV-RR where PPP = product, SSS = subsystem, UUU = unit, VVV = variant, RR = revision. The revision field changes with every engineering change that affects form, fit, or function. A dash number tracks changes that do not affect interchangeability.
3. Identify software and firmware CIs separately from hardware. Software changes faster than hardware and requires its own versioning scheme (typically semantic versioning: major.minor.patch). Maintain a hardware-to-software compatibility matrix showing which software versions run on which hardware revisions.
4. Identify document CIs: every specification, drawing, ICD, and test procedure that defines or verifies a hardware or software CI must itself be configuration-controlled. A change to a test procedure can change whether a product passes or fails without changing the product itself.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
