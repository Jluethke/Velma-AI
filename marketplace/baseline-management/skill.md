# Baseline Management

Establish and maintain configuration baselines at key program milestones, providing a controlled reference point for all subsequent changes.

## Inputs

- `ci-list`: All configuration items identified
- `ci-naming-convention`: Naming and versioning scheme

## Outputs

- `functional-baseline`: System-level specifications approved at system design review: what the system must do (performance requirements, interface requirements)
- `allocated-baseline`: Subsystem and unit specifications approved at preliminary design review: how the system will achieve the functional requirements
- `product-baseline`: Detailed design documents approved at critical design review: the complete definition of the as-designed product (drawings, software source, firmware images)

## Process

1. Establish the functional baseline at the system design review. This captures the top-level 'what': system performance specifications, system interface requirements, and the concept of operations. After this baseline, any change to what the system must do requires formal change control.
2. Establish the allocated baseline at the preliminary design review. This captures the 'how at subsystem level': subsystem specifications, interface control documents, and the allocated performance budgets. Changes below the functional baseline but above the allocated baseline are managed within the design team. Changes to the allocated baseline require a broader review.
3. Establish the product baseline at the critical design review. This captures the complete as-designed product: detail drawings, software source code, firmware binaries, manufacturing procedures, and test procedures. After this point, every change to the product definition goes through the change control board.
4. Maintain baseline traceability: every CI revision traces back to the baseline it was released against and the engineering change(s) that modified it. At any point, it must be possible to reconstruct the exact product definition at any baseline or any subsequent revision. This is the foundation for fielded-product support and failure investigation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
