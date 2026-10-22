# Process Capability Verification

Verify that the machining process is capable of consistently producing parts within specification through statistical analysis and measurement system evaluation.

## Inputs

- `cutting-parameters`: Finalized machining parameters
- `workpiece-specification`: Dimensional tolerances and surface finish requirements to verify capability against

## Outputs

- `capability-assessment`: Process capability indices (Cp, Cpk) for each critical dimension, with histogram and control chart data
- `measurement-system-analysis`: Gage R&R results for the measurement system used to assess capability (acceptable if %GRR < 10% of tolerance for critical dimensions, < 30% for non-critical)

## Process

1. First validate the measurement system. Perform a gage R&R study (AIAG MSA method) with 10 parts, 3 operators, 3 repeats. Calculate %GRR as a percentage of the tolerance. If %GRR > 30%, the measurement system is inadequate; improve the gage before assessing process capability. For CMM measurements, verify the probe qualification, fixturing repeatability, and thermal compensation.
2. Run a capability study. Machine a minimum of 30 consecutive parts under normal production conditions (include tool changes, reloads, thermal variations). Measure each critical dimension. Calculate Cp = (USL - LSL) / (6 * sigma) and Cpk = min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma)). For most manufacturing: Cpk > 1.33 is acceptable, Cpk > 1.67 for safety-critical dimensions, Cpk > 2.0 for zero-defect targets.
3. If Cpk is below target, diagnose the cause. Low Cp (process variation too wide): investigate sources of variation (thermal drift, tool wear, fixture clamping variation, material hardness variation, spindle bearing play). Low Cpk with adequate Cp (process not centered): adjust the tool offset to center the process. Use X-bar and R control charts to distinguish between common cause and special cause variation.
4. Implement ongoing process control. Set SPC control limits from the capability study data. Monitor key dimensions on a control chart basis (every nth part, or 100% for critical characteristics). Define the control plan: measurement method, frequency, sample size, reaction plan for out-of-control conditions. For high-precision work (tolerances below 10 microns), environmental control (temperature within 1C of 20C) and warm-up protocols (run the machine for 30+ minutes before production) are required.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
