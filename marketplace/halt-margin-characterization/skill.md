# Halt Margin Characterization

Run Highly Accelerated Life Testing to find the product's operating and destruct limits for temperature and vibration, establishing the margins that define the ESS design space.

## Inputs

- `product-specification`: Operating temperature range, vibration specification, and reliability targets
- `product-samples`: Number of samples available for HALT (typically 3-10 units, these will be stressed to failure and are consumed)

## Outputs

- `operating-limits`: Measured upper and lower operating temperature limits and operating vibration limit where first functional failure occurs (recoverable)
- `destruct-limits`: Measured upper and lower destruct temperature limits and destruct vibration limit where permanent damage occurs
- `failure-mode-catalog`: Each failure mode found during HALT with its stress level, failure mechanism, and design fix recommendation

## Process

1. Begin cold step stress: start at +20C and decrease in 10C steps with 10-minute dwell at each step. At each step, run the product functional test. Record the temperature at first functional failure (lower operating limit) and the temperature at permanent failure (lower destruct limit).
2. Run hot step stress: start at +20C and increase in 10C steps with 10-minute dwell at each step. Record upper operating and destruct limits the same way. Typical findings: crystal oscillator frequency shift, LCD contrast failure, electrolytic capacitor impedance rise, solder joint cracking.
3. Run vibration step stress: start at 5 Grms broadband random vibration (6 degrees of freedom) and increase in 5 Grms steps with 10 minutes at each step. Record the vibration level at first failure. Common findings: connector intermittence, crystal oscillator failure, board flexure cracking BGA solder joints.
4. Run combined environment stress: set temperature to the midpoint of hot and cold operating limits, apply vibration at 50% of the vibration operating limit, and rapid thermal cycling (60C/minute rate of change if the chamber supports it). Run for 3 to 5 cycles. This catches interaction failures not found in single-stress testing.
5. For each failure found, perform root cause analysis and implement a design fix. Re-run HALT on the fixed design to verify the margin increased. The goal is not zero failures in HALT (that means you did not stress hard enough) but to find and fix design weaknesses before production.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
