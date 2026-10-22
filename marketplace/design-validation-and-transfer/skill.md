# Design Validation And Transfer

Validate the device under actual or simulated use conditions to confirm it meets user needs, then transfer the validated design to manufacturing with complete documentation.

## Inputs

- `verification-test-reports`: Completed verification results
- `design-output-package`: Final device design documentation
- `risk-management-file`: Risk file with residual risk assessment
- `verification-traceability`: Verification status for all inputs

## Outputs

- `validation-report`: Results of validation testing under use conditions with clinical or simulated-use data
- `design-history-file`: Complete DHF containing all design control records from inputs through validation
- `design-transfer-package`: Manufacturing-ready documentation with device master record, process validations, and acceptance procedures

## Process

1. Design validation tests the finished device (or production-equivalent units) under conditions of actual or simulated use. This is not re-verification. It answers: does the device satisfy the user need in the hands of the intended user?
2. For devices requiring clinical data, design the clinical study per the clinical trial plan. For devices where simulated use suffices, design the simulated-use study with representative users performing representative tasks.
3. Validation must include software validation (per IEC 62304), usability validation (per IEC 62366), biocompatibility testing (per ISO 10993), and sterilization validation if applicable.
4. Compile the design history file: user needs, design inputs, risk management file, design outputs, verification results, validation results, and all design review records. This is the regulatory submission evidence.
5. Execute design transfer: hand off the device master record to manufacturing, confirm that process validations (IQ/OQ/PQ) are complete, verify that incoming/in-process/final inspection procedures are in place, and confirm that trained personnel are available.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
