# Acceptance Test Procedure

Define the acceptance test that screens each production unit for workmanship and function without consuming qualification margin or life.

## Inputs

- `test-levels`: The qualification levels, which set the ceiling the acceptance levels sit below
- `production-config`: The production unit configuration and the functional performance it must demonstrate

## Outputs

- `acceptance-procedure`: The acceptance screens and functional tests applied to every unit, with pass/fail criteria and the level and duration of each screen
- `screening-rationale`: The rationale tying each screen to the defect it catches and confirming it does not consume unacceptable life

## Process

1. Build acceptance to catch workmanship and part defects, not to re-prove the design. Acceptance screens find the cold solder joint, the loose fastener, the marginal part, and the assembly error on an individual unit; the design was already proven in qualification. Keep acceptance focused on unit-to-unit escapes.
2. Set acceptance levels between service and qualification. Acceptance vibration and thermal screens run above the service environment to precipitate latent defects but below qualification so they do not consume meaningful life. A common thermal screen runs several cycles across the operating range; a vibration screen runs a short random exposure per axis.
3. Include a functional performance test at the limits of the specification. Every unit demonstrates its functional requirements across the operating range (temperature extremes, voltage extremes, load points), not just at nominal, so a unit marginal only at the corner is caught. Record the measured performance, not just pass/fail, to see drift across the production run.
4. Bound the life consumed by acceptance screening. Each screen uses some fatigue and thermal life; sum the acceptance exposures across all screens and confirm they stay a small fraction of the qualified life, so the delivered unit retains its margin. A screen that consumes significant life is a design or screen-level problem.
5. Define clear pass/fail and the retest and nonconformance path. State the accept criteria, the action on a failure (repair and full re-screen, or scrap), and the limit on how many times a unit may be reworked and re-screened before it is no longer representative of qualified hardware. Random intermittent failures during screening are findings, not nuisances to retest away.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
