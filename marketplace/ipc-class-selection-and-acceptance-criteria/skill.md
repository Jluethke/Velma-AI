# Ipc Class Selection And Acceptance Criteria

Select the appropriate IPC class (1, 2, or 3) based on product requirements, and understand the manufacturing implications of each class on cost, yield, and reliability.

## Inputs

- `product-application`: Product type and environment (consumer, industrial, automotive, aerospace, medical)
- `reliability-requirement`: Expected product lifetime and operating conditions
- `component-library`: Component types for acceptance criteria application

## Outputs

- `ipc-class-selection`: Selected IPC class with justification, and the specific IPC standards that apply (IPC-A-610 for assembly, IPC-6012 for bare board)
- `critical-acceptance-criteria`: Key acceptance criteria that differ between classes and affect design or manufacturing: solder joint shape, hole fill percentage, annular ring minimum, conductor spacing
- `cost-impact-analysis`: Expected cost increase for each class step-up: Class 1 baseline, Class 2 typically 5-15% over Class 1, Class 3 typically 25-50% over Class 2

## Process

1. Match the product to an IPC class: Class 1 (general electronics, consumer products with limited life expectancy), Class 2 (dedicated service electronics, industrial and commercial equipment where continued operation is important), Class 3 (high-performance electronics, aerospace, military, medical life-support, where failure is not acceptable).
2. Understand what changes between classes: Class 3 requires minimum 75% through-hole fill (Class 2 allows 50%), minimum 2 mil annular ring (Class 2 allows 1 mil), zero solder voids over a percentage of the pad area (Class 2 is more lenient), and tighter conductor width/spacing tolerances. Each tighter requirement reduces manufacturing yield and increases cost.
3. For most commercial and industrial products, Class 2 is the correct choice. Class 3 is appropriate only when the application genuinely requires it (human-safety critical, impossible to service, extreme reliability). Do not specify Class 3 for cost reasons or perceived quality improvement; the cost and lead time increase is significant and the additional reliability is only needed in specific applications.
4. Document the IPC class on the fabrication and assembly drawings. Include specific callouts for any criteria where you need to deviate from the class default (e.g., Class 2 board with Class 3 annular ring on specific nets, or specific solder joint criteria for safety-critical connections).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
