# Fixed Point Boundary Testing

Test fixed-point math implementations for overflow, underflow, rounding errors, and precision loss at boundary values.

## Inputs

- `hil-test-cases`: Hardware-level tests; this flow adds algorithmic boundary tests for fixed-point code
- `firmware-architecture`: Modules using fixed-point arithmetic with their Q formats and value ranges

## Outputs

- `fixed-point-test-suite`: Test cases for each fixed-point operation: inputs at boundaries, expected outputs calculated in floating-point, and maximum acceptable error (ULP count)
- `precision-analysis`: For each fixed-point calculation chain: accumulated error from input to output, identifying where precision loss occurs and whether it affects the application

## Process

1. Identify all fixed-point operations in the firmware. For each, document the Q format (e.g., Q15 = 16-bit signed with 15 fractional bits, range -1.0 to +0.999969). List the operations: add, subtract, multiply (with shift), divide, and any conversions between Q formats.
2. For each operation, define boundary test values. Addition: both operands at maximum positive (overflow), both at maximum negative (underflow), one at max positive and one at max negative (should not overflow). Multiplication in Q15: 0x7FFF * 0x7FFF must not overflow the intermediate 32-bit result before the shift.
3. Calculate expected outputs using double-precision floating-point as the reference. Convert the fixed-point input to float, perform the operation, convert back to fixed-point. The maximum acceptable error is the quantization step size (1 ULP = 2^-Q where Q is the fractional bits). Most operations should be within 1 ULP; chained operations may accumulate to 2 or 3 ULP.
4. Test saturation behavior: if the firmware uses saturating arithmetic (clips to max/min instead of wrapping), verify that overflow produces the maximum representable value, not a wrapped-around value. If using wrapping arithmetic, verify the firmware checks for overflow before the operation.
5. Trace precision through calculation chains: a PID controller with Q15 coefficients multiplied by Q15 error, accumulated in Q31, and shifted back to Q15 output. Each step introduces up to 1 ULP error. A 10-step chain can accumulate 10 ULP, which in Q15 is 10/32768 = 0.03%. Verify this is within the application's tolerance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
