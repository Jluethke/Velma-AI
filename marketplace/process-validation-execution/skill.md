# Process Validation Execution

Execute process validation for manufacturing: installation qualification, operational qualification, and performance qualification for each special process.

## Inputs

- `process-validation-plan`: Processes to validate with protocol outlines
- `device-master-record`: Process specifications and acceptance criteria

## Outputs

- `process-validation-reports`: IQ/OQ/PQ reports for each validated process with data and conclusions
- `control-plan`: Manufacturing control plan specifying in-process controls, inspection points, and sampling plans for each operation

## Process

1. Installation Qualification (IQ): verify that equipment is installed per manufacturer specifications. Document equipment make, model, serial number, calibration status, utility connections, and software version. Verify against the purchase specification.
2. Operational Qualification (OQ): demonstrate that the process operates within specified parameters across the operating range. Identify worst-case parameter combinations (highest and lowest settings that could occur in production). Run the process at worst-case corners and verify output meets acceptance criteria.
3. Performance Qualification (PQ): run the process at nominal production conditions for 3 consecutive production-sized batches (or 30 consecutive units minimum). Inspect every unit against all acceptance criteria. Calculate process capability (Cpk) for measurable characteristics. Cpk above 1.33 indicates a capable process.
4. For processes with attribute outputs (pass/fail), use a sampling plan per ANSI/ASQ Z1.4 or demonstrate zero defects in an appropriate sample size for the target defect rate (e.g., 59 units for 95% confidence that the defect rate is below 5%).
5. Establish the ongoing control plan: specify the process parameter monitoring (frequency, method, limits), in-process inspection points, sampling plans for each inspection, and reaction plans for out-of-specification results. The control plan is the living document that maintains validated state.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
