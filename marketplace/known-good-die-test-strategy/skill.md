# Known Good Die Test Strategy

Design the test strategy to ensure each chiplet is a known-good-die before assembly, minimizing package-level fallout.

## Inputs

- `partition-candidates`: Chiplet definitions with I/O count and function
- `thermal-model`: Thermal constraints affecting test conditions

## Outputs

- `test-plan`: Test sequence per chiplet: wafer probe, singulated die test, and package-level test with coverage targets and cost estimates
- `kgd-yield-model`: Expected KGD yield and its impact on composite package yield

## Process

1. Define test coverage targets. For a 4-chiplet package, if each chiplet has 99% KGD quality, composite package yield from KGD alone is 0.99^4 = 96%. For 95% KGD, composite drops to 81%. Set KGD target from package yield goal.
2. Design wafer-level probe test: at-speed functional test of core logic, parametric test of analog blocks, IDDQ for defect screening. Account for limited probe contact at fine bump pitch (may need temporary test pads or BIST).
3. Evaluate singulated die testing: after dicing, test dies in a carrier or temporary substrate. Higher test coverage than wafer probe (access to all bumps) but added handling cost and risk of damage.
4. Calculate test cost per good die at each stage. Compare cost of testing at wafer vs singulated die vs accepting package-level fallout. The break-even depends on chiplet cost and assembly cost.
5. Define package-level test for assembled multi-chiplet package: die-to-die link verification, system-level functional, burn-in for infant mortality screening. Package-level test catches assembly defects that KGD testing cannot.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
